// =====================================
// DASHBOARD CARD COMPONENT
// =====================================

// src/components/Dashboard/DashboardCard.js
import React from 'react';
import './DashboardCard.css';

function DashboardCard({ title, value, icon, color, trend, trendValue }) {
  return (
    <div className={`dashboard-card ${color}`}>
      <div className="dashboard-card-header">
        <div className="dashboard-card-title">{title}</div>
        <div className="dashboard-card-icon">{icon}</div>
      </div>
      
      <div className="dashboard-card-content">
        <div className="dashboard-card-value">{value}</div>
        
        {trend && (
          <div className={`dashboard-card-trend ${trend}`}>
            <span className="trend-icon">
              {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}
            </span>
            <span className="trend-value">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardCard;

// =====================================
// CONSULTAS HOJE COMPONENT
// =====================================

// src/components/Dashboard/ConsultasHoje.js
import React from 'react';
import { formatters } from '../../utils/formatters';
import './ConsultasHoje.css';

function ConsultasHoje({ consultas }) {
  if (!consultas || consultas.length === 0) {
    return (
      <div className="consultas-hoje-empty">
        <div className="empty-icon">📅</div>
        <p>Nenhuma consulta agendada para hoje</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmada': return '✅';
      case 'agendada': return '⏰';
      case 'realizada': return '✔️';
      case 'cancelada': return '❌';
      case 'faltou': return '⚠️';
      default: return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmada': return '#28a745';
      case 'agendada': return '#ffc107';
      case 'realizada': return '#6c757d';
      case 'cancelada': return '#dc3545';
      case 'faltou': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  return (
    <div className="consultas-hoje">
      {consultas.map((consulta, index) => (
        <div key={index} className={`consulta-item ${consulta.status}`}>
          <div className="consulta-time">
            <div className="time-display">
              {formatters.time(consulta.dataHora?.toDate())}
            </div>
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(consulta.status) }}
            >
              {getStatusIcon(consulta.status)}
            </div>
          </div>
          
          <div className="consulta-details">
            <div className="consulta-patient">
              <strong>{consulta.pacienteNome || 'Paciente não informado'}</strong>
            </div>
            <div className="consulta-doctor">
              👨‍⚕️ {consulta.medicoNome || 'Médico não informado'}
            </div>
            <div className="consulta-reason">
              {consulta.motivo || 'Motivo não informado'}
            </div>
            {consulta.observacoes && (
              <div className="consulta-notes">
                💬 {consulta.observacoes}
              </div>
            )}
          </div>
          
          <div className="consulta-actions">
            <button 
              className="quick-action-btn"
              title="Ver detalhes"
            >
              👁️
            </button>
            {consulta.status === 'agendada' && (
              <button 
                className="quick-action-btn confirm"
                title="Confirmar"
              >
                ✅
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConsultasHoje;

// =====================================
// PACIENTE DETALHES MODAL
// =====================================

// src/components/Pacientes/PacienteDetalhesModal.js
import React, { useState, useEffect } from 'react';
import { PacienteService } from '../../services/PacienteService';
import { ConsultaService } from '../../services/ConsultaService';
import { formatters } from '../../utils/formatters';
import './PacienteDetalhesModal.css';

function PacienteDetalhesModal({ isOpen, onClose, paciente, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [historicoConsultas, setHistoricoConsultas] = useState([]);
  const [consultasFuturas, setConsultasFuturas] = useState([]);

  const pacienteService = new PacienteService();
  const consultaService = new ConsultaService();

  useEffect(() => {
    if (isOpen && paciente) {
      loadPacienteData();
    }
  }, [isOpen, paciente]);

  const loadPacienteData = async () => {
    setLoading(true);
    try {
      const [historico, futuras] = await Promise.all([
        pacienteService.getHistoricoConsultas(paciente.id),
        pacienteService.getConsultasFuturas(paciente.id)
      ]);
      
      setHistoricoConsultas(historico);
      setConsultasFuturas(futuras);
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 'Não informado';
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return `${idade} anos`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'agendada': { color: '#ffc107', label: 'Agendada' },
      'confirmada': { color: '#28a745', label: 'Confirmada' },
      'realizada': { color: '#6c757d', label: 'Realizada' },
      'cancelada': { color: '#dc3545', label: 'Cancelada' },
      'faltou': { color: '#fd7e14', label: 'Faltou' }
    };

    const config = statusConfig[status] || { color: '#6c757d', label: status };
    
    return (
      <span 
        className="status-badge-small"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  if (!isOpen || !paciente) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container paciente-detalhes-modal">
        <div className="modal-header">
          <h2>📋 Detalhes do Paciente</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {/* Header do Paciente */}
          <div className="paciente-header">
            <div className="paciente-avatar-large">
              {paciente.nome.charAt(0).toUpperCase()}
            </div>
            <div className="paciente-info-header">
              <h3>{paciente.nome}</h3>
              <div className="paciente-meta">
                <span>👤 {calcularIdade(paciente.dataNascimento)}</span>
                <span>📞 {paciente.telefone}</span>
                {paciente.whatsapp && (
                  <span>📱 {paciente.whatsapp}</span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="paciente-tabs">
            <button 
              className={activeTab === 'info' ? 'active' : ''}
              onClick={() => setActiveTab('info')}
            >
              📋 Informações
            </button>
            <button 
              className={activeTab === 'historico' ? 'active' : ''}
              onClick={() => setActiveTab('historico')}
            >
              🏥 Histórico ({historicoConsultas.length})
            </button>
            <button 
              className={activeTab === 'futuras' ? 'active' : ''}
              onClick={() => setActiveTab('futuras')}
            >
              📅 Próximas ({consultasFuturas.length})
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="tab-content">
            {/* Tab Informações */}
            {activeTab === 'info' && (
              <div className="info-grid">
                <div className="info-section">
                  <h4>👤 Dados Pessoais</h4>
                  <div className="info-item">
                    <label>Nome Completo:</label>
                    <span>{paciente.nome}</span>
                  </div>
                  <div className="info-item">
                    <label>CPF:</label>
                    <span>{paciente.cpf || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>RG:</label>
                    <span>{paciente.rg || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Data de Nascimento:</label>
                    <span>{formatters.date(paciente.dataNascimento) || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Sexo:</label>
                    <span>{paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h4>📞 Contato</h4>
                  <div className="info-item">
                    <label>Telefone:</label>
                    <span>{paciente.telefone}</span>
                  </div>
                  <div className="info-item">
                    <label>WhatsApp:</label>
                    <span>{paciente.whatsapp || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{paciente.email || 'Não informado'}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h4>🏠 Endereço</h4>
                  <div className="info-item">
                    <label>Rua:</label>
                    <span>{paciente.endereco?.rua || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Cidade:</label>
                    <span>{paciente.endereco?.cidade || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Estado:</label>
                    <span>{paciente.endereco?.estado || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>CEP:</label>
                    <span>{paciente.endereco?.cep || 'Não informado'}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h4>🏥 Dados Médicos</h4>
                  <div className="info-item">
                    <label>Convênio:</label>
                    <span>{paciente.dadosMedicos?.convenio || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Carteirinha:</label>
                    <span>{paciente.dadosMedicos?.numeroCarteirinha || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <label>Alergias:</label>
                    <span>
                      {paciente.dadosMedicos?.alergias?.length > 0 
                        ? paciente.dadosMedicos.alergias.join(', ')
                        : 'Nenhuma alergia registrada'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Medicamentos:</label>
                    <span>
                      {paciente.dadosMedicos?.medicamentos?.length > 0 
                        ? paciente.dadosMedicos.medicamentos.join(', ')
                        : 'Nenhum medicamento registrado'
                      }
                    </span>
                  </div>
                  {paciente.dadosMedicos?.observacoes && (
                    <div className="info-item">
                      <label>Observações:</label>
                      <span>{paciente.dadosMedicos.observacoes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Histórico */}
            {activeTab === 'historico' && (
              <div className="consultas-list">
                {loading ? (
                  <div className="loading-small">Carregando histórico...</div>
                ) : historicoConsultas.length > 0 ? (
                  historicoConsultas.map((consulta, index) => (
                    <div key={index} className="consulta-card">
                      <div className="consulta-card-header">
                        <div className="consulta-date">
                          📅 {formatters.date(consulta.dataHora?.toDate())}
                        </div>
                        {getStatusBadge(consulta.status)}
                      </div>
                      <div className="consulta-card-body">
                        <div className="consulta-info-row">
                          <span className="label">Médico:</span>
                          <span>{consulta.medicoNome || 'Não informado'}</span>
                        </div>
                        <div className="consulta-info-row">
                          <span className="label">Motivo:</span>
                          <span>{consulta.motivo || 'Não informado'}</span>
                        </div>
                        {consulta.observacoes && (
                          <div className="consulta-info-row">
                            <span className="label">Observações:</span>
                            <span>{consulta.observacoes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🏥</div>
                    <p>Nenhuma consulta no histórico</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Consultas Futuras */}
            {activeTab === 'futuras' && (
              <div className="consultas-list">
                {loading ? (
                  <div className="loading-small">Carregando consultas...</div>
                ) : consultasFuturas.length > 0 ? (
                  consultasFuturas.map((consulta, index) => (
                    <div key={index} className="consulta-card">
                      <div className="consulta-card-header">
                        <div className="consulta-date">
                          📅 {formatters.datetime(consulta.dataHora?.toDate())}
                        </div>
                        {getStatusBadge(consulta.status)}
                      </div>
                      <div className="consulta-card-body">
                        <div className="consulta-info-row">
                          <span className="label">Médico:</span>
                          <span>{consulta.medicoNome || 'Não informado'}</span>
                        </div>
                        <div className="consulta-info-row">
                          <span className="label">Motivo:</span>
                          <span>{consulta.motivo || 'Não informado'}</span>
                        </div>
                        <div className="consulta-info-row">
                          <span className="label">Duração:</span>
                          <span>{consulta.duracao} minutos</span>
                        </div>
                        {consulta.observacoes && (
                          <div className="consulta-info-row">
                            <span className="label">Observações:</span>
                            <span>{consulta.observacoes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <p>Nenhuma consulta agendada</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button onClick={onClose} className="btn-secondary">
              Fechar
            </button>
            <button 
              onClick={() => {
                // Implementar edição do paciente
                console.log('Editar paciente:', paciente.id);
              }}
              className="btn-primary"
            >
              ✏️ Editar Paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PacienteDetalhesModal;

// =====================================
// LOADING COMPONENT
// =====================================

// src/components/UI/Loading.js
import React from 'react';
import './Loading.css';

function Loading({ message = 'Carregando...', size = 'medium' }) {
  return (
    <div className={`loading-container ${size}`}>
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default Loading;

// =====================================
// NOTIFICATION COMPONENT
// =====================================

// src/components/UI/Notification.js
import React, { useState, useEffect } from 'react';
import './Notification.css';

function Notification({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose,
  autoClose = true 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`notification ${type} ${isVisible ? 'show' : 'hide'}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        {title && <div className="notification-title">{title}</div>}
        <div className="notification-message">{message}</div>
      </div>
      
      <button 
        className="notification-close"
        onClick={handleClose}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export default Notification;

// =====================================
// CONTEXT DE NOTIFICAÇÕES
// =====================================

// src/contexts/NotificationContext.js
import React, { createContext, useContext, useState } from 'react';
import Notification from '../components/UI/Notification';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const success = (message, title = 'Sucesso') => {
    return addNotification({ type: 'success', title, message });
  };

  const error = (message, title = 'Erro') => {
    return addNotification({ type: 'error', title, message });
  };

  const warning = (message, title = 'Atenção') => {
    return addNotification({ type: 'warning', title, message });
  };

  const info = (message, title = 'Informação') => {
    return addNotification({ type: 'info', title, message });
  };

  const value = {
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      <div className="notifications-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// =====================================
// THEME CONTEXT
// =====================================

// src/contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('mediagenda-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mediagenda-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =====================================
// HOOK PARA CONSULTAS
// =====================================

// src/hooks/useConsultas.js
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConsultaService } from '../services/ConsultaService';

export function useConsultas() {
  const { userData } = useAuth();
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const consultaService = new ConsultaService();

  const loadConsultas = async (filtros = {}) => {
    if (!userData?.clinicaId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let consultasData;
      
      if (filtros.data) {
        consultasData = await consultaService.getConsultasPorData(filtros.data);
      } else if (filtros.dataInicio && filtros.dataFim) {
        consultasData = await consultaService.getConsultasPorPeriodo(
          userData.clinicaId,
          filtros.dataInicio,
          filtros.dataFim
        );
      } else {
        // Consultas de hoje por padrão
        consultasData = await consultaService.getConsultasPorData(new Date());
      }
      
      setConsultas(consultasData);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar consultas:', err);
    } finally {
      setLoading(false);
    }
  };

  const criarConsulta = async (consultaData) => {
    try {
      const id = await consultaService.criarConsulta({
        ...consultaData,
        clinicaId: userData.clinicaId
      });
      
      // Recarregar consultas
      await loadConsultas();
      
      return id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const atualizarConsulta = async (consultaId, updates) => {
    try {
      await consultaService.atualizarConsulta(consultaId, updates);
      
      // Recarregar consultas
      await loadConsultas();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const confirmarConsulta = async (consultaId) => {
    try {
      await consultaService.confirmarConsulta(consultaId);
      
      // Recarregar consultas
      await loadConsultas();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const cancelarConsulta = async (consultaId, motivo) => {
    try {
      await consultaService.cancelarConsulta(consultaId, motivo);
      
      // Recarregar consultas
      await loadConsultas();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (userData?.clinicaId) {
      loadConsultas();
    }
  }, [userData?.clinicaId]);

  return {
    consultas,
    loading,
    error,
    loadConsultas,
    criarConsulta,
    atualizarConsulta,
    confirmarConsulta,
    cancelarConsulta,
    refresh: loadConsultas
  };
}

// =====================================
// HOOK PARA PACIENTES
// =====================================

// src/hooks/usePacientes.js
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PacienteService } from '../services/PacienteService';

export function usePacientes() {
  const { userData } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pacienteService = new PacienteService();

  const loadPacientes = async () => {
    if (!userData?.clinicaId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const pacientesData = await pacienteService.getPacientesPorClinica(userData.clinicaId);
      setPacientes(pacientesData);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const criarPaciente = async (pacienteData) => {
    try {
      const id = await pacienteService.criarPaciente({
        ...pacienteData,
        clinicaId: userData.clinicaId
      });
      
      // Recarregar pacientes
      await loadPacientes();
      
      return id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const atualizarPaciente = async (pacienteId, updates) => {
    try {
      await pacienteService.atualizarPaciente(pacienteId, updates);
      
      // Recarregar pacientes
      await loadPacientes();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const buscarPacientes = async (termo) => {
    try {
      return await pacienteService.buscarPacientes(userData.clinicaId, termo);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (userData?.clinicaId) {
      loadPacientes();
    }
  }, [userData?.clinicaId]);

  return {
    pacientes,
    loading,
    error,
    loadPacientes,
    criarPaciente,
    atualizarPaciente,
    buscarPacientes,
    refresh: loadPacientes
  };
}
