// =====================================
// SERVIÇO DE RELATÓRIOS
// =====================================

// src/services/RelatorioService.js
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class RelatorioService {
  
  async getEstatisticasGerais(clinicaId, dataInicio, dataFim) {
    try {
      const q = query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('dataHora', '>=', Timestamp.fromDate(dataInicio)),
        where('dataHora', '<=', Timestamp.fromDate(dataFim))
      );

      const querySnapshot = await getDocs(q);
      const consultas = querySnapshot.docs.map(doc => doc.data());

      const estatisticas = {
        totalConsultas: consultas.length,
        consultasRealizadas: consultas.filter(c => c.status === 'realizada').length,
        consultasCanceladas: consultas.filter(c => c.status === 'cancelada').length,
        consultasAgendadas: consultas.filter(c => c.status === 'agendada').length,
        consultasConfirmadas: consultas.filter(c => c.status === 'confirmada').length,
        faltasRegistradas: consultas.filter(c => c.status === 'faltou').length,
        faturamentoTotal: consultas
          .filter(c => c.status === 'realizada' && c.valores?.valorConsulta)
          .reduce((total, c) => total + c.valores.valorConsulta, 0),
        mediaConsultasPorDia: 0,
        taxaPresenca: 0,
        taxaCancelamento: 0
      };

      if (estatisticas.totalConsultas > 0) {
        estatisticas.taxaPresenca = (estatisticas.consultasRealizadas / estatisticas.totalConsultas) * 100;
        estatisticas.taxaCancelamento = (estatisticas.consultasCanceladas / estatisticas.totalConsultas) * 100;
        
        const diasPeriodo = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
        estatisticas.mediaConsultasPorDia = estatisticas.totalConsultas / diasPeriodo;
      }

      return estatisticas;
    } catch (error) {
      throw new Error(`Erro ao gerar estatísticas: ${error.message}`);
    }
  }

  async getConsultasPorDia(clinicaId, dataInicio, dataFim) {
    try {
      const q = query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('dataHora', '>=', Timestamp.fromDate(dataInicio)),
        where('dataHora', '<=', Timestamp.fromDate(dataFim)),
        orderBy('dataHora', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const consultas = querySnapshot.docs.map(doc => doc.data());

      // Agrupar por dia
      const consultasPorDia = {};
      consultas.forEach(consulta => {
        const data = consulta.dataHora.toDate().toISOString().split('T')[0];
        if (!consultasPorDia[data]) {
          consultasPorDia[data] = {
            data: new Date(data).toLocaleDateString('pt-BR'),
            total: 0,
            realizadas: 0,
            canceladas: 0,
            agendadas: 0
          };
        }
        
        consultasPorDia[data].total++;
        consultasPorDia[data][consulta.status]++;
      });

      return Object.values(consultasPorDia);
    } catch (error) {
      throw new Error(`Erro ao buscar consultas por dia: ${error.message}`);
    }
  }

  async getConsultasPorMedico(clinicaId, dataInicio, dataFim) {
    try {
      const [consultasSnapshot, medicosSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'consultas'),
          where('clinicaId', '==', clinicaId),
          where('dataHora', '>=', Timestamp.fromDate(dataInicio)),
          where('dataHora', '<=', Timestamp.fromDate(dataFim))
        )),
        getDocs(query(
          collection(db, 'medicos'),
          where('clinicaId', '==', clinicaId),
          where('ativo', '==', true)
        ))
      ]);

      const consultas = consultasSnapshot.docs.map(doc => doc.data());
      const medicos = medicosSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});

      // Agrupar por médico
      const consultasPorMedico = {};
      consultas.forEach(consulta => {
        const medicoId = consulta.medicoId;
        const medicoNome = medicos[medicoId]?.nome || 'Médico não encontrado';
        
        if (!consultasPorMedico[medicoId]) {
          consultasPorMedico[medicoId] = {
            medico: medicoNome,
            total: 0,
            realizadas: 0,
            canceladas: 0,
            faturamento: 0
          };
        }
        
        consultasPorMedico[medicoId].total++;
        if (consulta.status === 'realizada') {
          consultasPorMedico[medicoId].realizadas++;
          if (consulta.valores?.valorConsulta) {
            consultasPorMedico[medicoId].faturamento += consulta.valores.valorConsulta;
          }
        } else if (consulta.status === 'cancelada') {
          consultasPorMedico[medicoId].canceladas++;
        }
      });

      return Object.values(consultasPorMedico);
    } catch (error) {
      throw new Error(`Erro ao buscar consultas por médico: ${error.message}`);
    }
  }

  async getConsultasPorStatus(clinicaId, dataInicio, dataFim) {
    try {
      const q = query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('dataHora', '>=', Timestamp.fromDate(dataInicio)),
        where('dataHora', '<=', Timestamp.fromDate(dataFim))
      );

      const querySnapshot = await getDocs(q);
      const consultas = querySnapshot.docs.map(doc => doc.data());

      const statusCount = {};
      consultas.forEach(consulta => {
        const status = consulta.status || 'indefinido';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      const statusLabels = {
        'agendada': 'Agendadas',
        'confirmada': 'Confirmadas',
        'realizada': 'Realizadas',
        'cancelada': 'Canceladas',
        'faltou': 'Faltas'
      };

      return Object.entries(statusCount).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar consultas por status: ${error.message}`);
    }
  }

  async getFaturamento(clinicaId, dataInicio, dataFim) {
    try {
      const q = query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('dataHora', '>=', Timestamp.fromDate(dataInicio)),
        where('dataHora', '<=', Timestamp.fromDate(dataFim)),
        where('status', '==', 'realizada')
      );

      const querySnapshot = await getDocs(q);
      const consultas = querySnapshot.docs.map(doc => doc.data());

      // Agrupar por mês
      const faturamentoPorPeriodo = {};
      consultas.forEach(consulta => {
        if (consulta.valores?.valorConsulta) {
          const data = consulta.dataHora.toDate();
          const periodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
          
          if (!faturamentoPorPeriodo[periodo]) {
            faturamentoPorPeriodo[periodo] = {
              periodo: new Date(data.getFullYear(), data.getMonth()).toLocaleDateString('pt-BR', { 
                month: 'short', 
                year: 'numeric' 
              }),
              valor: 0,
              quantidade: 0
            };
          }
          
          faturamentoPorPeriodo[periodo].valor += consulta.valores.valorConsulta;
          faturamentoPorPeriodo[periodo].quantidade++;
        }
      });

      return Object.values(faturamentoPorPeriodo);
    } catch (error) {
      throw new Error(`Erro ao buscar faturamento: ${error.message}`);
    }
  }

  async exportarPDF(estatisticas, consultasPorDia) {
    // Implementar exportação PDF usando jsPDF ou similar
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    doc.text('Relatório MediAgenda', 20, 20);
    doc.text(`Total de Consultas: ${estatisticas.totalConsultas}`, 20, 40);
    doc.text(`Consultas Realizadas: ${estatisticas.consultasRealizadas}`, 20, 50);
    doc.text(`Taxa de Presença: ${estatisticas.taxaPresenca.toFixed(1)}%`, 20, 60);
    doc.text(`Faturamento: R$ ${estatisticas.faturamentoTotal.toLocaleString('pt-BR')}`, 20, 70);
    
    doc.save('relatorio-mediagenda.pdf');
  }

  async exportarExcel(estatisticas, consultasPorDia) {
    // Implementar exportação Excel usando xlsx
    const XLSX = await import('xlsx');
    
    const workbook = XLSX.utils.book_new();
    
    // Aba de estatísticas
    const estatisticasWS = XLSX.utils.json_to_sheet([estatisticas]);
    XLSX.utils.book_append_sheet(workbook, estatisticasWS, 'Estatísticas');
    
    // Aba de consultas por dia
    const consultasWS = XLSX.utils.json_to_sheet(consultasPorDia);
    XLSX.utils.book_append_sheet(workbook, consultasWS, 'Consultas por Dia');
    
    XLSX.writeFile(workbook, 'relatorio-mediagenda.xlsx');
  }
}

// =====================================
// COMPONENTE DE CONFIGURAÇÕES
// =====================================

// src/components/Configuracoes/Configuracoes.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfiguracaoService } from '../../services/ConfiguracaoService';
import './Configuracoes.css';

function Configuracoes() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [configs, setConfigs] = useState({
    geral: {
      nomeClinica: '',
      endereco: '',
      telefone: '',
      email: '',
      horarioFuncionamento: {
        segunda: { inicio: '08:00', fim: '18:00' },
        terca: { inicio: '08:00', fim: '18:00' },
        quarta: { inicio: '08:00', fim: '18:00' },
        quinta: { inicio: '08:00', fim: '18:00' },
        sexta: { inicio: '08:00', fim: '18:00' },
        sabado: { inicio: '08:00', fim: '12:00' },
        domingo: { inicio: '', fim: '' }
      },
      intervaloConsulta: 30,
      antecedenciaMinima: 2
    },
    whatsapp: {
      ativo: false,
      apiUrl: '',
      token: '',
      templates: {
        confirmacao: 'Olá {nome}! Sua consulta com {medico} está agendada para {data} às {hora}. Confirme com SIM ou CANCELAR.',
        lembrete: 'Lembrete: Você tem consulta amanhã às {hora} com {medico}. Local: {endereco}',
        cancelamento: 'Sua consulta do dia {data} às {hora} foi cancelada. Entre em contato para reagendar.'
      }
    },
    backup: {
      ativo: true,
      frequencia: 'diario',
      horario: '02:00'
    }
  });

  const configuracaoService = new ConfiguracaoService();

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = async () => {
    try {
      const configData = await configuracaoService.getConfiguracoes(userData.clinicaId);
      if (configData) {
        setConfigs(prevConfigs => ({
          ...prevConfigs,
          ...configData
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await configuracaoService.salvarConfiguracoes(userData.clinicaId, configs);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section, field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfigs(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [parent]: {
            ...prev[section][parent],
            [child]: value
          }
        }
      }));
    } else {
      setConfigs(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  const testarWhatsApp = async () => {
    try {
      await configuracaoService.testarWhatsApp(configs.whatsapp);
      setMessage({ type: 'success', text: 'Teste do WhatsApp enviado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro no teste do WhatsApp: ' + error.message });
    }
  };

  if (loading) {
    return <div className="loading">Carregando configurações...</div>;
  }

  return (
    <div className="configuracoes">
      <div className="configuracoes-header">
        <h2>⚙️ Configurações do Sistema</h2>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="configuracoes-container">
        {/* Tabs */}
        <div className="config-tabs">
          <button 
            className={activeTab === 'geral' ? 'active' : ''}
            onClick={() => setActiveTab('geral')}
          >
            🏥 Geral
          </button>
          <button 
            className={activeTab === 'whatsapp' ? 'active' : ''}
            onClick={() => setActiveTab('whatsapp')}
          >
            📱 WhatsApp
          </button>
          <button 
            className={activeTab === 'backup' ? 'active' : ''}
            onClick={() => setActiveTab('backup')}
          >
            💾 Backup
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="config-content">
          {/* Tab Geral */}
          {activeTab === 'geral' && (
            <div className="config-section">
              <h3>Informações da Clínica</h3>
              
              <div className="form-group">
                <label>Nome da Clínica</label>
                <input
                  type="text"
                  value={configs.geral.nomeClinica}
                  onChange={(e) => updateConfig('geral', 'nomeClinica', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Endereço</label>
                  <input
                    type="text"
                    value={configs.geral.endereco}
                    onChange={(e) => updateConfig('geral', 'endereco', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={configs.geral.telefone}
                    onChange={(e) => updateConfig('geral', 'telefone', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={configs.geral.email}
                  onChange={(e) => updateConfig('geral', 'email', e.target.value)}
                />
              </div>

              <h3>Horário de Funcionamento</h3>
              {Object.entries(configs.geral.horarioFuncionamento).map(([dia, horario]) => (
                <div key={dia} className="horario-row">
                  <label>{dia.charAt(0).toUpperCase() + dia.slice(1)}</label>
                  <input
                    type="time"
                    value={horario.inicio}
                    onChange={(e) => updateConfig('geral', `horarioFuncionamento.${dia}.inicio`, e.target.value)}
                  />
                  <span>às</span>
                  <input
                    type="time"
                    value={horario.fim}
                    onChange={(e) => updateConfig('geral', `horarioFuncionamento.${dia}.fim`, e.target.value)}
                  />
                </div>
              ))}

              <h3>Configurações de Agendamento</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Intervalo entre Consultas (minutos)</label>
                  <select
                    value={configs.geral.intervaloConsulta}
                    onChange={(e) => updateConfig('geral', 'intervaloConsulta', parseInt(e.target.value))}
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Antecedência Mínima (horas)</label>
                  <select
                    value={configs.geral.antecedenciaMinima}
                    onChange={(e) => updateConfig('geral', 'antecedenciaMinima', parseInt(e.target.value))}
                  >
                    <option value={1}>1 hora</option>
                    <option value={2}>2 horas</option>
                    <option value={4}>4 horas</option>
                    <option value={12}>12 horas</option>
                    <option value={24}>24 horas</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab WhatsApp */}
          {activeTab === 'whatsapp' && (
            <div className="config-section">
              <h3>Configurações do WhatsApp</h3>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={configs.whatsapp.ativo}
                    onChange={(e) => updateConfig('whatsapp', 'ativo', e.target.checked)}
                  />
                  Ativar envio automático via WhatsApp
                </label>
              </div>

              {configs.whatsapp.ativo && (
                <>
                  <div className="form-group">
                    <label>URL da API</label>
                    <input
                      type="url"
                      value={configs.whatsapp.apiUrl}
                      onChange={(e) => updateConfig('whatsapp', 'apiUrl', e.target.value)}
                      placeholder="https://api.whatsapp.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Token de Acesso</label>
                    <input
                      type="password"
                      value={configs.whatsapp.token}
                      onChange={(e) => updateConfig('whatsapp', 'token', e.target.value)}
                      placeholder="Seu token da API do WhatsApp"
                    />
                  </div>

                  <h4>Templates de Mensagem</h4>
                  <p className="template-help">
                    Use as variáveis: {'{nome}'}, {'{medico}'}, {'{data}'}, {'{hora}'}, {'{endereco}'}
                  </p>

                  <div className="form-group">
                    <label>Confirmação de Consulta</label>
                    <textarea
                      value={configs.whatsapp.templates.confirmacao}
                      onChange={(e) => updateConfig('whatsapp', 'templates.confirmacao', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Lembrete de Consulta</label>
                    <textarea
                      value={configs.whatsapp.templates.lembrete}
                      onChange={(e) => updateConfig('whatsapp', 'templates.lembrete', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cancelamento de Consulta</label>
                    <textarea
                      value={configs.whatsapp.templates.cancelamento}
                      onChange={(e) => updateConfig('whatsapp', 'templates.cancelamento', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="test-section">
                    <button onClick={testarWhatsApp} className="btn-test">
                      🧪 Testar WhatsApp
                    </button>
                    <p>Enviará uma mensagem de teste para verificar a configuração</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab Backup */}
          {activeTab === 'backup' && (
            <div className="config-section">
              <h3>Configurações de Backup</h3>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={configs.backup.ativo}
                    onChange={(e) => updateConfig('backup', 'ativo', e.target.checked)}
                  />
                  Ativar backup automático
                </label>
              </div>

              {configs.backup.ativo && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Frequência</label>
                      <select
                        value={configs.backup.frequencia}
                        onChange={(e) => updateConfig('backup', 'frequencia', e.target.value)}
                      >
                        <option value="diario">Diário</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensal">Mensal</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Horário</label>
                      <input
                        type="time"
                        value={configs.backup.horario}
                        onChange={(e) => updateConfig('backup', 'horario', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="backup-info">
                    <h4>ℹ️ Informações sobre Backup</h4>
                    <ul>
                      <li>Os backups são armazenados de forma segura no Firebase Storage</li>
                      <li>Incluem todas as informações de pacientes, consultas e configurações</li>
                      <li>São mantidos por 90 dias automaticamente</li>
                      <li>Podem ser restaurados pelo administrador do sistema</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="config-actions">
          <button onClick={loadConfiguracoes} className="btn-secondary" disabled={saving}>
            🔄 Recarregar
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;

// =====================================
// SERVIÇO DE CONFIGURAÇÕES
// =====================================

// src/services/ConfiguracaoService.js
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class ConfiguracaoService {
  
  async getConfiguracoes(clinicaId) {
    try {
      const q = query(
        collection(db, 'configuracoes_sistema'),
        where('clinicaId', '==', clinicaId)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }
  }

  async salvarConfiguracoes(clinicaId, configuracoes) {
    try {
      // Buscar documento existente
      const configExistente = await this.getConfiguracoes(clinicaId);
      
      const dados = {
        ...configuracoes,
        clinicaId: clinicaId,
        atualizadoEm: Timestamp.now()
      };

      if (configExistente) {
        // Atualizar documento existente
        await setDoc(doc(db, 'configuracoes_sistema', configExistente.id), dados);
      } else {
        // Criar novo documento
        dados.criadoEm = Timestamp.now();
        await setDoc(doc(db, 'configuracoes_sistema', `config_${clinicaId}`), dados);
      }
    } catch (error) {
      throw new Error(`Erro ao salvar configurações: ${error.message}`);
    }
  }

  async testarWhatsApp(configWhatsApp) {
    try {
      if (!configWhatsApp.apiUrl || !configWhatsApp.token) {
        throw new Error('Configure a URL da API e o token antes de testar');
      }

      const response = await fetch(`${configWhatsApp.apiUrl}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${configWhatsApp.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Teste de configuração do MediAgenda - WhatsApp funcionando!'
        })
      });

      if (!response.ok) {
        throw new Error('Erro na API do WhatsApp');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Erro no teste do WhatsApp: ${error.message}`);
    }
  }
}

// =====================================
// UTILITÁRIOS E HELPERS
// =====================================

// src/utils/formatters.js
export const formatters = {
  // Formatação de CPF
  cpf: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },

  // Formatação de telefone
  phone: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');
  },

  // Formatação de CEP
  cep: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  },

  // Formatação de moeda
  currency: (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  // Formatação de data
  date: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  },

  // Formatação de data e hora
  datetime: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR');
  },

  // Formatação de hora
  time: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// src/utils/validators.js
export const validators = {
  // Validação de CPF
  cpf: (cpf) => {
    if (!cpf) return false;
    
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  },

  // Validação de email
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Validação de telefone
  phone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  // Validação de CEP
  cep: (cep) => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  },

  // Validação de data futura
  futureDate: (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    return checkDate >= today;
  },

  // Validação de horário comercial
  businessHours: (time, config) => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeMinutes = hours * 60 + minutes;
    
    const day = new Date().getDay();
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayConfig = config.horarioFuncionamento[dayNames[day]];
    
    if (!dayConfig || !dayConfig.inicio || !dayConfig.fim) {
      return false; // Não funciona neste dia
    }
    
    const [startHours, startMinutes] = dayConfig.inicio.split(':').map(Number);
    const [endHours, endMinutes] = dayConfig.fim.split(':').map(Number);
    
    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;
    
    return timeMinutes >= startTime && timeMinutes <= endTime;
  }
};

// src/utils/constants.js
export const CONSTANTS = {
  STATUS_CONSULTA: {
    AGENDADA: 'agendada',
    CONFIRMADA: 'confirmada',
    REALIZADA: 'realizada',
    CANCELADA: 'cancelada',
    FALTOU: 'faltou'
  },

  PERFIS_USUARIO: {
    ADMIN: 'admin',
    MEDICO: 'medico',
    RECEPCIONISTA: 'recepcionista'
  },

  TIPOS_CONSULTA: {
    PRIMEIRA_VEZ: 'primeira-vez',
    RETORNO: 'retorno',
    URGENCIA: 'urgencia'
  },

  CORES_STATUS: {
    agendada: '#ffc107',
    confirmada: '#28a745',
    realizada: '#6c757d',
    cancelada: '#dc3545',
    faltou: '#fd7e14'
  },

  DURACOES_CONSULTA: [15, 30, 45, 60, 90, 120],

  DIAS_SEMANA: [
    'domingo',
    'segunda',
    'terca',
    'quarta', 
    'quinta',
    'sexta',
    'sabado'
  ],

  MENSAGENS_PADRAO: {
    CONFIRMACAO: 'Olá {nome}! Sua consulta com {medico} está agendada para {data} às {hora}. Confirme com SIM ou CANCELAR.',
    LEMBRETE: 'Lembrete: Você tem consulta amanhã às {hora} com {medico}. Local: {endereco}',
    CANCELAMENTO: 'Sua consulta do dia {data} às {hora} foi cancelada. Entre em contato para reagendar.'
  }
};

// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage para chave "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao salvar no localStorage para chave "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}