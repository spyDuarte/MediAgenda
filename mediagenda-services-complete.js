// =====================================
// SERVIÇO DE PACIENTES
// =====================================

// src/services/PacienteService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class PacienteService {
  
  async criarPaciente(pacienteData) {
    try {
      // Verificar se CPF já existe
      if (pacienteData.cpf) {
        const existingPaciente = await this.buscarPorCPF(pacienteData.clinicaId, pacienteData.cpf);
        if (existingPaciente) {
          throw new Error('Já existe um paciente cadastrado com este CPF');
        }
      }

      const docRef = await addDoc(collection(db, 'pacientes'), {
        ...pacienteData,
        ativo: true,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      throw new Error(`Erro ao criar paciente: ${error.message}`);
    }
  }

  async atualizarPaciente(pacienteId, updates) {
    try {
      const pacienteRef = doc(db, 'pacientes', pacienteId);
      await updateDoc(pacienteRef, {
        ...updates,
        atualizadoEm: Timestamp.now()
      });
    } catch (error) {
      throw new Error(`Erro ao atualizar paciente: ${error.message}`);
    }
  }

  async deletePaciente(pacienteId) {
    try {
      // Verificar se o paciente tem consultas futuras
      const consultasFuturas = await this.getConsultasFuturas(pacienteId);
      if (consultasFuturas.length > 0) {
        throw new Error('Não é possível excluir paciente com consultas futuras agendadas');
      }

      // Marcar como inativo ao invés de deletar
      await this.atualizarPaciente(pacienteId, { ativo: false });
    } catch (error) {
      throw new Error(`Erro ao excluir paciente: ${error.message}`);
    }
  }

  async getPacienteById(pacienteId) {
    try {
      const pacienteDoc = await getDoc(doc(db, 'pacientes', pacienteId));
      if (pacienteDoc.exists()) {
        return { id: pacienteDoc.id, ...pacienteDoc.data() };
      }
      throw new Error('Paciente não encontrado');
    } catch (error) {
      throw new Error(`Erro ao buscar paciente: ${error.message}`);
    }
  }

  async getPacientesPorClinica(clinicaId) {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('clinicaId', '==', clinicaId),
        where('ativo', '==', true),
        orderBy('nome', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar pacientes: ${error.message}`);
    }
  }

  async buscarPacientes(clinicaId, searchTerm) {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('clinicaId', '==', clinicaId),
        where('ativo', '==', true),
        orderBy('nome', 'asc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const pacientes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar localmente (Firestore não suporta busca por texto completo)
      return pacientes.filter(paciente =>
        paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paciente.cpf && paciente.cpf.includes(searchTerm)) ||
        (paciente.telefone && paciente.telefone.includes(searchTerm))
      );
    } catch (error) {
      throw new Error(`Erro ao buscar pacientes: ${error.message}`);
    }
  }

  async buscarPorCPF(clinicaId, cpf) {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('clinicaId', '==', clinicaId),
        where('cpf', '==', cpf),
        where('ativo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.length > 0 ? 
        { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } : 
        null;
    } catch (error) {
      throw new Error(`Erro ao buscar paciente por CPF: ${error.message}`);
    }
  }

  async getTotalPacientes(clinicaId) {
    try {
      const q = query(
        collection(db, 'pacientes'),
        where('clinicaId', '==', clinicaId),
        where('ativo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      throw new Error(`Erro ao contar pacientes: ${error.message}`);
    }
  }

  async getConsultasFuturas(pacienteId) {
    try {
      const agora = Timestamp.now();
      const q = query(
        collection(db, 'consultas'),
        where('pacienteId', '==', pacienteId),
        where('dataHora', '>', agora),
        where('status', 'in', ['agendada', 'confirmada'])
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar consultas futuras: ${error.message}`);
    }
  }

  async getHistoricoConsultas(pacienteId) {
    try {
      const q = query(
        collection(db, 'consultas'),
        where('pacienteId', '==', pacienteId),
        orderBy('dataHora', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }
  }
}

// =====================================
// SERVIÇO DE MÉDICOS
// =====================================

// src/services/MedicoService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class MedicoService {
  
  async criarMedico(medicoData) {
    try {
      // Verificar se CRM já existe
      const existingMedico = await this.buscarPorCRM(medicoData.crm);
      if (existingMedico) {
        throw new Error('Já existe um médico cadastrado com este CRM');
      }

      const docRef = await addDoc(collection(db, 'medicos'), {
        ...medicoData,
        ativo: true,
        criadoEm: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      throw new Error(`Erro ao criar médico: ${error.message}`);
    }
  }

  async atualizarMedico(medicoId, updates) {
    try {
      const medicoRef = doc(db, 'medicos', medicoId);
      await updateDoc(medicoRef, {
        ...updates,
        atualizadoEm: Timestamp.now()
      });
    } catch (error) {
      throw new Error(`Erro ao atualizar médico: ${error.message}`);
    }
  }

  async getMedicoById(medicoId) {
    try {
      const medicoDoc = await getDoc(doc(db, 'medicos', medicoId));
      if (medicoDoc.exists()) {
        return { id: medicoDoc.id, ...medicoDoc.data() };
      }
      throw new Error('Médico não encontrado');
    } catch (error) {
      throw new Error(`Erro ao buscar médico: ${error.message}`);
    }
  }

  async getMedicosPorClinica(clinicaId) {
    try {
      const q = query(
        collection(db, 'medicos'),
        where('clinicaId', '==', clinicaId),
        where('ativo', '==', true),
        orderBy('nome', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar médicos: ${error.message}`);
    }
  }

  async buscarPorCRM(crm) {
    try {
      const q = query(
        collection(db, 'medicos'),
        where('crm', '==', crm),
        where('ativo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.length > 0 ? 
        { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } : 
        null;
    } catch (error) {
      throw new Error(`Erro ao buscar médico por CRM: ${error.message}`);
    }
  }

  async getAgendaDisponibilidade(medicoId, data) {
    try {
      // Buscar configurações do médico
      const medico = await this.getMedicoById(medicoId);
      const diaSemana = this.getDiaSemana(data);
      const configDia = medico.configuracoes?.horarioAtendimento?.[diaSemana];

      if (!configDia || configDia.length === 0) {
        return [];
      }

      // Buscar consultas já agendadas para o dia
      const startOfDay = new Date(data);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(data);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'consultas'),
        where('medicoId', '==', medicoId),
        where('dataHora', '>=', Timestamp.fromDate(startOfDay)),
        where('dataHora', '<=', Timestamp.fromDate(endOfDay)),
        where('status', 'in', ['agendada', 'confirmada'])
      );

      const consultasSnapshot = await getDocs(q);
      const consultasOcupadas = consultasSnapshot.docs.map(doc => {
        const consulta = doc.data();
        return {
          inicio: consulta.dataHora.toDate(),
          fim: new Date(consulta.dataHora.toDate().getTime() + (consulta.duracao * 60000))
        };
      });

      // Gerar slots disponíveis
      const slotsDisponiveis = [];
      const duracaoConsulta = medico.configuracoes?.duracaoConsulta || 30;

      configDia.forEach(periodo => {
        const [horaInicio, minutoInicio] = periodo.inicio.split(':').map(Number);
        const [horaFim, minutoFim] = periodo.fim.split(':').map(Number);

        const inicioPerido = new Date(data);
        inicioPerido.setHours(horaInicio, minutoInicio, 0, 0);

        const fimPeriodo = new Date(data);
        fimPeriodo.setHours(horaFim, minutoFim, 0, 0);

        let slotAtual = new Date(inicioPerido);

        while (slotAtual < fimPeriodo) {
          const fimSlot = new Date(slotAtual.getTime() + (duracaoConsulta * 60000));
          
          if (fimSlot <= fimPeriodo) {
            // Verificar se o slot não está ocupado
            const ocupado = consultasOcupadas.some(ocupacao => 
              (slotAtual >= ocupacao.inicio && slotAtual < ocupacao.fim) ||
              (fimSlot > ocupacao.inicio && fimSlot <= ocupacao.fim)
            );

            if (!ocupado) {
              slotsDisponiveis.push({
                inicio: new Date(slotAtual),
                fim: new Date(fimSlot)
              });
            }
          }

          slotAtual = new Date(slotAtual.getTime() + (duracaoConsulta * 60000));
        }
      });

      return slotsDisponiveis;
    } catch (error) {
      throw new Error(`Erro ao buscar disponibilidade: ${error.message}`);
    }
  }

  getDiaSemana(data) {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[data.getDay()];
  }
}

// =====================================
// MODAL DE PACIENTE (CRIAR/EDITAR)
// =====================================

// src/components/Pacientes/PacienteModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PacienteService } from '../../services/PacienteService';
import './PacienteModal.css';

function PacienteModal({ isOpen, onClose, paciente, onSuccess }) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    sexo: 'M',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: {
      rua: '',
      cidade: 'Teresópolis',
      estado: 'RJ',
      cep: ''
    },
    dadosMedicos: {
      convenio: '',
      numeroCarteirinha: '',
      observacoes: '',
      alergias: [],
      medicamentos: []
    }
  });

  const [alergiasInput, setAlergiasInput] = useState('');
  const [medicamentosInput, setMedicamentosInput] = useState('');

  const pacienteService = new PacienteService();

  useEffect(() => {
    if (isOpen) {
      if (paciente) {
        // Editando paciente existente
        setFormData({
          ...paciente,
          endereco: paciente.endereco || {
            rua: '',
            cidade: 'Teresópolis',
            estado: 'RJ',
            cep: ''
          },
          dadosMedicos: paciente.dadosMedicos || {
            convenio: '',
            numeroCarteirinha: '',
            observacoes: '',
            alergias: [],
            medicamentos: []
          }
        });
        setAlergiasInput(paciente.dadosMedicos?.alergias?.join(', ') || '');
        setMedicamentosInput(paciente.dadosMedicos?.medicamentos?.join(', ') || '');
      } else {
        // Novo paciente
        resetForm();
      }
    }
  }, [isOpen, paciente]);

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      sexo: 'M',
      telefone: '',
      whatsapp: '',
      email: '',
      endereco: {
        rua: '',
        cidade: 'Teresópolis',
        estado: 'RJ',
        cep: ''
      },
      dadosMedicos: {
        convenio: '',
        numeroCarteirinha: '',
        observacoes: '',
        alergias: [],
        medicamentos: []
      }
    });
    setAlergiasInput('');
    setMedicamentosInput('');
    setError('');
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validações
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }

      if (!formData.telefone.trim()) {
        throw new Error('Telefone é obrigatório');
      }

      // Preparar dados finais
      const finalData = {
        ...formData,
        clinicaId: userData.clinicaId,
        dadosMedicos: {
          ...formData.dadosMedicos,
          alergias: alergiasInput.split(',').map(item => item.trim()).filter(item => item),
          medicamentos: medicamentosInput.split(',').map(item => item.trim()).filter(item => item)
        }
      };

      if (paciente) {
        // Atualizar paciente existente
        await pacienteService.atualizarPaciente(paciente.id, finalData);
      } else {
        // Criar novo paciente
        await pacienteService.criarPaciente(finalData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container paciente-modal">
        <div className="modal-header">
          <h2>{paciente ? 'Editar Paciente' : 'Novo Paciente'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Informações Pessoais */}
          <div className="form-section">
            <h3>📋 Informações Pessoais</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sexo</label>
                <select
                  value={formData.sexo}
                  onChange={(e) => handleInputChange('sexo', e.target.value)}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div className="form-group">
                <label>RG</label>
                <input
                  type="text"
                  value={formData.rg}
                  onChange={(e) => handleInputChange('rg', e.target.value)}
                  placeholder="00.000.000-0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Data de Nascimento</label>
              <input
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
              />
            </div>
          </div>

          {/* Contato */}
          <div className="form-section">
            <h3>📞 Contato</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Telefone *</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                  placeholder="(21) 99999-9999"
                  required
                />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                  placeholder="(21) 99999-9999"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="paciente@email.com"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="form-section">
            <h3>🏠 Endereço</h3>
            
            <div className="form-group">
              <label>Rua e Número</label>
              <input
                type="text"
                value={formData.endereco.rua}
                onChange={(e) => handleInputChange('endereco.rua', e.target.value)}
                placeholder="Rua das Flores, 123"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cidade</label>
                <input
                  type="text"
                  value={formData.endereco.cidade}
                  onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  value={formData.endereco.estado}
                  onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                >
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="SP">São Paulo</option>
                  <option value="MG">Minas Gerais</option>
                  {/* Adicionar outros estados conforme necessário */}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>CEP</label>
              <input
                type="text"
                value={formData.endereco.cep}
                onChange={(e) => handleInputChange('endereco.cep', formatCEP(e.target.value))}
                placeholder="25950-000"
                maxLength={9}
              />
            </div>
          </div>

          {/* Dados Médicos */}
          <div className="form-section">
            <h3>🏥 Dados Médicos</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Convênio</label>
                <input
                  type="text"
                  value={formData.dadosMedicos.convenio}
                  onChange={(e) => handleInputChange('dadosMedicos.convenio', e.target.value)}
                  placeholder="Unimed, Bradesco Saúde, etc."
                />
              </div>
              <div className="form-group">
                <label>Número da Carteirinha</label>
                <input
                  type="text"
                  value={formData.dadosMedicos.numeroCarteirinha}
                  onChange={(e) => handleInputChange('dadosMedicos.numeroCarteirinha', e.target.value)}
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Alergias (separadas por vírgula)</label>
              <input
                type="text"
                value={alergiasInput}
                onChange={(e) => setAlergiasInput(e.target.value)}
                placeholder="dipirona, penicilina, etc."
              />
            </div>

            <div className="form-group">
              <label>Medicamentos em Uso (separados por vírgula)</label>
              <input
                type="text"
                value={medicamentosInput}
                onChange={(e) => setMedicamentosInput(e.target.value)}
                placeholder="Losartana 50mg, Metformina 850mg, etc."
              />
            </div>

            <div className="form-group">
              <label>Observações Médicas</label>
              <textarea
                value={formData.dadosMedicos.observacoes}
                onChange={(e) => handleInputChange('dadosMedicos.observacoes', e.target.value)}
                placeholder="Informações relevantes sobre o estado de saúde do paciente"
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-cancel"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-success"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (paciente ? 'Atualizar' : 'Cadastrar')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PacienteModal;

// =====================================
// COMPONENTE DE RELATÓRIOS
// =====================================

// src/components/Relatorios/Relatorios.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RelatorioService } from '../../services/RelatorioService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './Relatorios.css';

function Relatorios() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes'); // 'semana', 'mes', 'trimestre', 'ano'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Dados dos relatórios
  const [estatisticasGerais, setEstatisticasGerais] = useState({});
  const [consultasPorDia, setConsultasPorDia] = useState([]);
  const [consultasPorMedico, setConsultasPorMedico] = useState([]);
  const [consultasPorStatus, setConsultasPorStatus] = useState([]);
  const [faturamento, setFaturamento] = useState([]);

  const relatorioService = new RelatorioService();

  useEffect(() => {
    // Definir datas padrão baseadas no período
    const hoje = new Date();
    let inicio, fim;

    switch (periodo) {
      case 'semana':
        inicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        fim = hoje;
        break;
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = hoje;
        break;
      case 'trimestre':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        fim = hoje;
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = hoje;
        break;
      default:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = hoje;
    }

    setDataInicio(inicio.toISOString().split('T')[0]);
    setDataFim(fim.toISOString().split('T')[0]);
  }, [periodo]);

  useEffect(() => {
    if (dataInicio && dataFim) {
      loadRelatorios();
    }
  }, [dataInicio, dataFim]);

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);

      const [
        estatisticas,
        consultasDia,
        consultasMedico,
        consultasStatus,
        dadosFaturamento
      ] = await Promise.all([
        relatorioService.getEstatisticasGerais(userData.clinicaId, inicio, fim),
        relatorioService.getConsultasPorDia(userData.clinicaId, inicio, fim),
        relatorioService.getConsultasPorMedico(userData.clinicaId, inicio, fim),
        relatorioService.getConsultasPorStatus(userData.clinicaId, inicio, fim),
        relatorioService.getFaturamento(userData.clinicaId, inicio, fim)
      ]);

      setEstatisticasGerais(estatisticas);
      setConsultasPorDia(consultasDia);
      setConsultasPorMedico(consultasMedico);
      setConsultasPorStatus(consultasStatus);
      setFaturamento(dadosFaturamento);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const cores = ['#2c5aa0', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

  if (loading) {
    return <div className="loading">Carregando relatórios...</div>;
  }

  return (
    <div className="relatorios">
      {/* Filtros */}
      <div className="relatorios-filters">
        <div className="period-buttons">
          {['semana', 'mes', 'trimestre', 'ano'].map(p => (
            <button
              key={p}
              className={periodo === p ? 'active' : ''}
              onClick={() => setPeriodo(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="date-range">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <span>até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <button onClick={loadRelatorios} className="btn-primary">
          🔄 Atualizar
        </button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="estatisticas-cards">
        <div className="estatistica-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>{estatisticasGerais.totalConsultas || 0}</h3>
            <p>Total de Consultas</p>
          </div>
        </div>

        <div className="estatistica-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>{estatisticasGerais.consultasRealizadas || 0}</h3>
            <p>Realizadas</p>
          </div>
        </div>

        <div className="estatistica-card">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <h3>{estatisticasGerais.consultasCanceladas || 0}</h3>
            <p>Canceladas</p>
          </div>
        </div>

        <div className="estatistica-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>R$ {(estatisticasGerais.faturamentoTotal || 0).toLocaleString('pt-BR')}</h3>
            <p>Faturamento</p>
          </div>
        </div>

        <div className="estatistica-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{((estatisticasGerais.consultasRealizadas / estatisticasGerais.totalConsultas) * 100 || 0).toFixed(1)}%</h3>
            <p>Taxa de Presença</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="graficos-container">
        {/* Consultas por Dia */}
        <div className="grafico-card">
          <h3>📈 Consultas por Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consultasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#2c5aa0" 
                strokeWidth={2}
                name="Total"
              />
              <Line 
                type="monotone" 
                dataKey="realizadas" 
                stroke="#28a745" 
                strokeWidth={2}
                name="Realizadas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Consultas por Médico */}
        <div className="grafico-card">
          <h3>👨‍⚕️ Consultas por Médico</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={consultasPorMedico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="medico" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#2c5aa0" name="Total" />
              <Bar dataKey="realizadas" fill="#28a745" name="Realizadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status das Consultas */}
        <div className="grafico-card">
          <h3>📊 Status das Consultas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={consultasPorStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {consultasPorStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Faturamento */}
        <div className="grafico-card">
          <h3>💰 Faturamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={faturamento}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']} />
              <Legend />
              <Bar dataKey="valor" fill="#28a745" name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ações de Exportação */}
      <div className="export-actions">
        <button className="btn-export" onClick={() => relatorioService.exportarPDF(estatisticasGerais, consultasPorDia)}>
          📄 Exportar PDF
        </button>
        <button className="btn-export" onClick={() => relatorioService.exportarExcel(estatisticasGerais, consultasPorDia)}>
          📊 Exportar Excel
        </button>
      </div>
    </div>
  );
}

export default Relatorios;