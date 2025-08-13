// =====================================
// MODAL DE AGENDAMENTO
// =====================================

// src/components/Agenda/AgendamentoModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ConsultaService } from '../../services/ConsultaService';
import { PacienteService } from '../../services/PacienteService';
import { MedicoService } from '../../services/MedicoService';
import './AgendamentoModal.css';

function AgendamentoModal({ isOpen, onClose, selectedSlot, medicos, onSuccess }) {
  const { userData } = useAuth();
  const [step, setStep] = useState(1); // 1: Paciente, 2: Detalhes, 3: Confirmação
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados do formulário
  const [pacienteId, setPacienteId] = useState('');
  const [pacienteNovo, setPacienteNovo] = useState(false);
  const [medicoId, setMedicoId] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [duracao, setDuracao] = useState(30);
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [tipoConsulta, setTipoConsulta] = useState('primeira-vez');

  // Estados para busca de paciente
  const [searchTerm, setSearchTerm] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);

  // Estados para novo paciente
  const [novoPaciente, setNovoPaciente] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    whatsapp: '',
    email: '',
    dataNascimento: '',
    sexo: 'M'
  });

  const consultaService = new ConsultaService();
  const pacienteService = new PacienteService();
  const medicoService = new MedicoService();

  useEffect(() => {
    if (isOpen && selectedSlot) {
      setDataHora(selectedSlot.start.toISOString().slice(0, 16));
    }
  }, [isOpen, selectedSlot]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchPacientes();
    }
  }, [searchTerm]);

  const searchPacientes = async () => {
    try {
      const results = await pacienteService.buscarPacientes(
        userData.clinicaId, 
        searchTerm
      );
      setPacientes(results);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  const handlePacienteSelect = (paciente) => {
    setSelectedPaciente(paciente);
    setPacienteId(paciente.id);
    setSearchTerm(paciente.nome);
    setPacientes([]);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!pacienteNovo && !pacienteId) {
        setError('Selecione um paciente ou marque "Novo Paciente"');
        return;
      }
      if (pacienteNovo && !novoPaciente.nome) {
        setError('Preencha o nome do paciente');
        return;
      }
    }
    
    if (step === 2) {
      if (!medicoId || !dataHora || !motivo) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let finalPacienteId = pacienteId;

      // Criar novo paciente se necessário
      if (pacienteNovo) {
        finalPacienteId = await pacienteService.criarPaciente({
          ...novoPaciente,
          clinicaId: userData.clinicaId
        });
      }

      // Criar consulta
      const consultaData = {
        clinicaId: userData.clinicaId,
        pacienteId: finalPacienteId,
        medicoId: medicoId,
        dataHora: new Date(dataHora),
        duracao: parseInt(duracao),
        motivo: motivo,
        observacoes: observacoes,
        tipoConsulta: tipoConsulta,
        criadoPor: userData.id
      };

      await consultaService.criarConsulta(consultaData);
      
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPacienteId('');
    setPacienteNovo(false);
    setMedicoId('');
    setDataHora('');
    setDuracao(30);
    setMotivo('');
    setObservacoes('');
    setTipoConsulta('primeira-vez');
    setSearchTerm('');
    setPacientes([]);
    setSelectedPaciente(null);
    setNovoPaciente({
      nome: '',
      cpf: '',
      telefone: '',
      whatsapp: '',
      email: '',
      dataNascimento: '',
      sexo: 'M'
    });
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container agendamento-modal">
        <div className="modal-header">
          <h2>Nova Consulta</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        {/* Progress Steps */}
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <label>Paciente</label>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <label>Detalhes</label>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <label>Confirmação</label>
          </div>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Step 1: Seleção do Paciente */}
          {step === 1 && (
            <div className="step-content">
              <h3>Selecionar Paciente</h3>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={pacienteNovo}
                    onChange={(e) => setPacienteNovo(e.target.checked)}
                  />
                  Novo Paciente
                </label>
              </div>

              {!pacienteNovo ? (
                <div className="patient-search">
                  <div className="form-group">
                    <label>Buscar Paciente</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Digite o nome ou CPF do paciente"
                    />
                  </div>

                  {pacientes.length > 0 && (
                    <div className="search-results">
                      {pacientes.map(paciente => (
                        <div
                          key={paciente.id}
                          className="search-result-item"
                          onClick={() => handlePacienteSelect(paciente)}
                        >
                          <div className="patient-info">
                            <h4>{paciente.nome}</h4>
                            <p>{paciente.cpf} • {paciente.telefone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="new-patient-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome Completo *</label>
                      <input
                        type="text"
                        value={novoPaciente.nome}
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          nome: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CPF</label>
                      <input
                        type="text"
                        value={novoPaciente.cpf}
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          cpf: e.target.value
                        })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Telefone *</label>
                      <input
                        type="tel"
                        value={novoPaciente.telefone}
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          telefone: e.target.value
                        })}
                        placeholder="(21) 99999-9999"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>WhatsApp</label>
                      <input
                        type="tel"
                        value={novoPaciente.whatsapp}
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          whatsapp: e.target.value
                        })}
                        placeholder="(21) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={novoPaciente.email}
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          email: e.target.value
                        })}
                        placeholder="paciente@email.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Data de Nascimento</label>
                      <input
                        type="date"
                        value={novoPaciente.dataNascimento}
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          dataNascimento: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sexo</label>
                    <select
                      value={novoPaciente.sexo}
                      onChange={(e) => setNovoPaciente({
                        ...novoPaciente,
                        sexo: e.target.value
                      })}
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Detalhes da Consulta */}
          {step === 2 && (
            <div className="step-content">
              <h3>Detalhes da Consulta</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Médico *</label>
                  <select
                    value={medicoId}
                    onChange={(e) => setMedicoId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um médico</option>
                    {medicos.map(medico => (
                      <option key={medico.id} value={medico.id}>
                        {medico.nome} - {medico.especialidades?.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo de Consulta</label>
                  <select
                    value={tipoConsulta}
                    onChange={(e) => setTipoConsulta(e.target.value)}
                  >
                    <option value="primeira-vez">Primeira vez</option>
                    <option value="retorno">Retorno</option>
                    <option value="urgencia">Urgência</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data e Hora *</label>
                  <input
                    type="datetime-local"
                    value={dataHora}
                    onChange={(e) => setDataHora(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duração (minutos)</label>
                  <select
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Motivo da Consulta *</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Consulta de rotina, Dor no peito, etc."
                  required
                />
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre a consulta"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmação */}
          {step === 3 && (
            <div className="step-content">
              <h3>Confirmar Agendamento</h3>
              
              <div className="confirmation-details">
                <div className="detail-group">
                  <label>Paciente:</label>
                  <span>{pacienteNovo ? novoPaciente.nome : selectedPaciente?.nome}</span>
                </div>
                
                <div className="detail-group">
                  <label>Médico:</label>
                  <span>{medicos.find(m => m.id === medicoId)?.nome}</span>
                </div>
                
                <div className="detail-group">
                  <label>Data e Hora:</label>
                  <span>{new Date(dataHora).toLocaleString('pt-BR')}</span>
                </div>
                
                <div className="detail-group">
                  <label>Duração:</label>
                  <span>{duracao} minutos</span>
                </div>
                
                <div className="detail-group">
                  <label>Motivo:</label>
                  <span>{motivo}</span>
                </div>
                
                {observacoes && (
                  <div className="detail-group">
                    <label>Observações:</label>
                    <span>{observacoes}</span>
                  </div>
                )}
              </div>

              <div className="confirmation-note">
                <p>⚠️ Após a confirmação, uma mensagem de WhatsApp será enviada automaticamente para o paciente.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            {step > 1 && (
              <button 
                onClick={handlePrevStep}
                className="btn-secondary"
                disabled={loading}
              >
                Voltar
              </button>
            )}
            
            <button onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancelar
            </button>
            
            {step < 3 ? (
              <button 
                onClick={handleNextStep}
                className="btn-primary"
                disabled={loading}
              >
                Próximo
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="btn-success"
                disabled={loading}
              >
                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgendamentoModal;

// =====================================
// MODAL DE DETALHES DA CONSULTA
// =====================================

// src/components/Agenda/DetalhesConsultaModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ConsultaService } from '../../services/ConsultaService';
import { PacienteService } from '../../services/PacienteService';
import { MedicoService } from '../../services/MedicoService';
import './DetalhesConsultaModal.css';

function DetalhesConsultaModal({ isOpen, onClose, consulta, onUpdate }) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacienteDetalhes, setPacienteDetalhes] = useState(null);
  const [medicoDetalhes, setMedicoDetalhes] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Estados para edição
  const [editData, setEditData] = useState({
    dataHora: '',
    duracao: 30,
    motivo: '',
    observacoes: '',
    status: 'agendada'
  });

  const consultaService = new ConsultaService();
  const pacienteService = new PacienteService();
  const medicoService = new MedicoService();

  useEffect(() => {
    if (isOpen && consulta) {
      loadConsultaDetails();
      setEditData({
        dataHora: consulta.dataHora?.toDate().toISOString().slice(0, 16) || '',
        duracao: consulta.duracao || 30,
        motivo: consulta.motivo || '',
        observacoes: consulta.observacoes || '',
        status: consulta.status || 'agendada'
      });
    }
  }, [isOpen, consulta]);

  const loadConsultaDetails = async () => {
    try {
      const [paciente, medico] = await Promise.all([
        pacienteService.getPacienteById(consulta.pacienteId),
        medicoService.getMedicoById(consulta.medicoId)
      ]);
      
      setPacienteDetalhes(paciente);
      setMedicoDetalhes(medico);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      setError('Erro ao carregar informações da consulta');
    }
  };

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await consultaService.confirmarConsulta(consulta.id, 'recepcionista');
      onUpdate?.();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
      return;
    }
    
    const motivo = prompt('Motivo do cancelamento:');
    if (motivo === null) return;

    setLoading(true);
    try {
      await consultaService.cancelarConsulta(consulta.id, motivo);
      onUpdate?.();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEdicao = async () => {
    setLoading(true);
    try {
      await consultaService.atualizarConsulta(consulta.id, {
        dataHora: new Date(editData.dataHora),
        duracao: parseInt(editData.duracao),
        motivo: editData.motivo,
        observacoes: editData.observacoes,
        status: editData.status
      });
      
      setEditMode(false);
      onUpdate?.();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'agendada': '#ffc107',
      'confirmada': '#28a745',
      'realizada': '#6c757d',
      'cancelada': '#dc3545',
      'faltou': '#fd7e14'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'agendada': 'Agendada',
      'confirmada': 'Confirmada',
      'realizada': 'Realizada',
      'cancelada': 'Cancelada',
      'faltou': 'Paciente Faltou'
    };
    return labels[status] || status;
  };

  if (!isOpen || !consulta) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container detalhes-consulta-modal">
        <div className="modal-header">
          <h2>Detalhes da Consulta</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="consulta-header">
            <div className="status-badge" style={{ backgroundColor: getStatusColor(consulta.status) }}>
              {getStatusLabel(consulta.status)}
            </div>
            
            {userData?.perfil === 'recepcionista' && (
              <button
                onClick={() => setEditMode(!editMode)}
                className="btn-edit"
                disabled={loading}
              >
                {editMode ? 'Cancelar Edição' : '✏️ Editar'}
              </button>
            )}
          </div>

          <div className="detalhes-grid">
            {/* Informações do Paciente */}
            <div className="detail-section">
              <h3>👤 Paciente</h3>
              {pacienteDetalhes ? (
                <div className="detail-content">
                  <p><strong>Nome:</strong> {pacienteDetalhes.nome}</p>
                  <p><strong>Telefone:</strong> {pacienteDetalhes.telefone}</p>
                  {pacienteDetalhes.whatsapp && (
                    <p><strong>WhatsApp:</strong> {pacienteDetalhes.whatsapp}</p>
                  )}
                  <p><strong>Email:</strong> {pacienteDetalhes.email || 'Não informado'}</p>
                </div>
              ) : (
                <div className="loading-small">Carregando...</div>
              )}
            </div>

            {/* Informações do Médico */}
            <div className="detail-section">
              <h3>👨‍⚕️ Médico</h3>
              {medicoDetalhes ? (
                <div className="detail-content">
                  <p><strong>Nome:</strong> {medicoDetalhes.nome}</p>
                  <p><strong>CRM:</strong> {medicoDetalhes.crm}</p>
                  <p><strong>Especialidades:</strong> {medicoDetalhes.especialidades?.join(', ')}</p>
                </div>
              ) : (
                <div className="loading-small">Carregando...</div>
              )}
            </div>
          </div>

          {/* Detalhes da Consulta */}
          <div className="detail-section">
            <h3>📅 Detalhes da Consulta</h3>
            <div className="detail-content">
              {!editMode ? (
                <>
                  <p><strong>Data e Hora:</strong> {consulta.dataHora?.toDate().toLocaleString('pt-BR')}</p>
                  <p><strong>Duração:</strong> {consulta.duracao} minutos</p>
                  <p><strong>Motivo:</strong> {consulta.motivo}</p>
                  <p><strong>Tipo:</strong> {consulta.tipoConsulta}</p>
                  {consulta.observacoes && (
                    <p><strong>Observações:</strong> {consulta.observacoes}</p>
                  )}
                </>
              ) : (
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Data e Hora</label>
                      <input
                        type="datetime-local"
                        value={editData.dataHora}
                        onChange={(e) => setEditData({
                          ...editData,
                          dataHora: e.target.value
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Duração (min)</label>
                      <select
                        value={editData.duracao}
                        onChange={(e) => setEditData({
                          ...editData,
                          duracao: e.target.value
                        })}
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Motivo</label>
                    <input
                      type="text"
                      value={editData.motivo}
                      onChange={(e) => setEditData({
                        ...editData,
                        motivo: e.target.value
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({
                        ...editData,
                        status: e.target.value
                      })}
                    >
                      <option value="agendada">Agendada</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="realizada">Realizada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="faltou">Paciente Faltou</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Observações</label>
                    <textarea
                      value={editData.observacoes}
                      onChange={(e) => setEditData({
                        ...editData,
                        observacoes: e.target.value
                      })}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Confirmação WhatsApp */}
          {consulta.confirmacao && (
            <div className="detail-section">
              <h3>📱 Confirmação WhatsApp</h3>
              <div className="detail-content">
                <p><strong>Enviado:</strong> {consulta.confirmacao.whatsappEnviado ? 'Sim' : 'Não'}</p>
                {consulta.confirmacao.dataEnvio && (
                  <p><strong>Data de Envio:</strong> {consulta.confirmacao.dataEnvio.toDate().toLocaleString('pt-BR')}</p>
                )}
                {consulta.confirmacao.confirmadoEm && (
                  <p><strong>Confirmado em:</strong> {consulta.confirmacao.confirmadoEm.toDate().toLocaleString('pt-BR')}</p>
                )}
                <p><strong>Confirmado por:</strong> {consulta.confirmacao.confirmadoPor || 'Pendente'}</p>
              </div>
            </div>
          )}

          {/* Histórico */}
          {consulta.historico && consulta.historico.length > 0 && (
            <div className="detail-section">
              <h3>📋 Histórico</h3>
              <div className="historico-list">
                {consulta.historico.map((item, index) => (
                  <div key={index} className="historico-item">
                    <div className="historico-timestamp">
                      {item.dataHora?.toDate().toLocaleString('pt-BR')}
                    </div>
                    <div className="historico-action">
                      <strong>{item.acao}</strong>
                      {item.observacao && <span> - {item.observacao}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="btn-cancel"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarEdicao}
                  className="btn-success"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="btn-secondary">
                  Fechar
                </button>
                
                {consulta.status === 'agendada' && userData?.perfil === 'recepcionista' && (
                  <>
                    <button
                      onClick={handleCancelar}
                      className="btn-danger"
                      disabled={loading}
                    >
                      Cancelar Consulta
                    </button>
                    <button
                      onClick={handleConfirmar}
                      className="btn-success"
                      disabled={loading}
                    >
                      {loading ? 'Confirmando...' : 'Confirmar Consulta'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalhesConsultaModal;

// =====================================
// COMPONENTE DE PACIENTES
// =====================================

// src/components/Pacientes/Pacientes.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PacienteService } from '../../services/PacienteService';
import { ConsultaService } from '../../services/ConsultaService';
import PacienteModal from './PacienteModal';
import PacienteDetalhesModal from './PacienteDetalhesModal';
import './Pacientes.css';

function Pacientes() {
  const { userData } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPacientes, setFilteredPacientes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modais
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [editingPaciente, setEditingPaciente] = useState(null);

  const pacienteService = new PacienteService();
  const consultaService = new ConsultaService();

  useEffect(() => {
    loadPacientes();
  }, []);

  useEffect(() => {
    filterPacientes();
  }, [searchTerm, pacientes]);

  const loadPacientes = async () => {
    try {
      const data = await pacienteService.getPacientesPorClinica(userData.clinicaId);
      setPacientes(data);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPacientes = () => {
    if (!searchTerm) {
      setFilteredPacientes(pacientes);
      return;
    }

    const filtered = pacientes.filter(paciente =>
      paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.cpf.includes(searchTerm) ||
      paciente.telefone.includes(searchTerm) ||
      (paciente.email && paciente.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredPacientes(filtered);
    setCurrentPage(1);
  };

  const handleNovoPaciente = () => {
    setEditingPaciente(null);
    setShowPacienteModal(true);
  };

  const handleEditarPaciente = (paciente) => {
    setEditingPaciente(paciente);
    setShowPacienteModal(true);
  };

  const handleVerDetalhes = (paciente) => {
    setSelectedPaciente(paciente);
    setShowDetalhesModal(true);
  };

  const handleDeletePaciente = async (pacienteId) => {
    if (!window.confirm('Tem certeza que deseja excluir este paciente?')) {
      return;
    }

    try {
      await pacienteService.deletePaciente(pacienteId);
      loadPacientes();
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      alert('Erro ao excluir paciente. Verifique se ele não possui consultas ativas.');
    }
  };

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPacientes = filteredPacientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage);

  if (loading) {
    return <div className="loading">Carregando pacientes...</div>;
  }

  return (
    <div className="pacientes">
      <div className="pacientes-header">
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button 
            onClick={handleNovoPaciente}
            className="btn-primary"
          >
            ➕ Novo Paciente
          </button>
        </div>

        <div className="pacientes-stats">
          <div className="stat-item">
            <span className="stat-number">{filteredPacientes.length}</span>
            <span className="stat-label">Total de Pacientes</span>
          </div>
        </div>
      </div>

      <div className="pacientes-table-container">
        <table className="pacientes-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Última Consulta</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentPacientes.map(paciente => (
              <tr key={paciente.id}>
                <td>
                  <div className="paciente-info">
                    <div className="paciente-avatar">
                      {paciente.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="paciente-nome">{paciente.nome}</div>
                      <div className="paciente-nascimento">
                        {paciente.dataNascimento && 
                          new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')
                        }
                      </div>
                    </div>
                  </div>
                </td>
                <td>{paciente.cpf || 'Não informado'}</td>
                <td>
                  <div>
                    <div>{paciente.telefone}</div>
                    {paciente.whatsapp && paciente.whatsapp !== paciente.telefone && (
                      <div className="whatsapp-number">📱 {paciente.whatsapp}</div>
                    )}
                  </div>
                </td>
                <td>{paciente.email || 'Não informado'}</td>
                <td>
                  <span className="ultima-consulta">
                    {paciente.ultimaConsulta ? 
                      new Date(paciente.ultimaConsulta).toLocaleDateString('pt-BR') : 
                      'Nunca'
                    }
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button 
                      onClick={() => handleVerDetalhes(paciente)}
                      className="btn-action btn-info"
                      title="Ver detalhes"
                    >
                      👁️
                    </button>
                    <button 
                      onClick={() => handleEditarPaciente(paciente)}
                      className="btn-action btn-warning"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeletePaciente(paciente.id)}
                      className="btn-action btn-danger"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPacientes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Nenhum paciente encontrado</h3>
            <p>{searchTerm ? 'Tente ajustar os termos de busca' : 'Comece cadastrando o primeiro paciente'}</p>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Modais */}
      {showPacienteModal && (
        <PacienteModal
          isOpen={showPacienteModal}
          onClose={() => {
            setShowPacienteModal(false);
            setEditingPaciente(null);
          }}
          paciente={editingPaciente}
          onSuccess={loadPacientes}
        />
      )}

      {showDetalhesModal && (
        <PacienteDetalhesModal
          isOpen={showDetalhesModal}
          onClose={() => {
            setShowDetalhesModal(false);
            setSelectedPaciente(null);
          }}
          paciente={selectedPaciente}
          onUpdate={loadPacientes}
        />
      )}
    </div>
  );
}

export default Pacientes;