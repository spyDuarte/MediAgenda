// =====================================
// CONTEXTO DE AUTENTICAÇÃO
// =====================================

// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const authService = new AuthService();

  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (user) => {
      setLoading(true);
      if (user) {
        try {
          const userData = await authService.getUserData(user.uid);
          setUser(user);
          setUserData(userData);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setUser(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setUserData(result.userData);
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setUserData(null);
  };

  const value = {
    user,
    userData,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =====================================
// COMPONENTE DE LOGIN
// =====================================

// src/components/Auth/Login.js
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, login } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>MediAgenda</h1>
          <p>Sistema de Agendamentos Médicos</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Sua senha"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Problemas para acessar? Contate o administrador</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

// =====================================
// LAYOUT PRINCIPAL
// =====================================

// src/components/Layout/Layout.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/agenda', label: 'Agenda', icon: '📅' },
    { path: '/pacientes', label: 'Pacientes', icon: '👥' },
    { path: '/relatorios', label: 'Relatórios', icon: '📈' },
    { path: '/configuracoes', label: 'Configurações', icon: '⚙️' }
  ];

  // Filtrar menus baseado no perfil
  const filteredMenuItems = menuItems.filter(item => {
    if (userData?.perfil === 'medico') {
      return ['/', '/agenda', '/pacientes'].includes(item.path);
    }
    if (userData?.perfil === 'recepcionista') {
      return ['/', '/agenda', '/pacientes'].includes(item.path);
    }
    return true; // Admin vê tudo
  });

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>MediAgenda</h2>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {filteredMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {userData?.nome?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{userData?.nome}</div>
                <div className="user-role">{userData?.perfil}</div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className="logout-button"
            title="Sair"
          >
            🚪 {sidebarOpen && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <h1>
            {location.pathname === '/' && 'Dashboard'}
            {location.pathname === '/agenda' && 'Agenda'}
            {location.pathname === '/pacientes' && 'Pacientes'}
            {location.pathname === '/relatorios' && 'Relatórios'}
            {location.pathname === '/configuracoes' && 'Configurações'}
          </h1>
          
          <div className="header-actions">
            <button className="notification-button">
              🔔
              <span className="notification-badge">3</span>
            </button>
          </div>
        </header>
        
        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;

// =====================================
// DASHBOARD
// =====================================

// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ConsultaService } from '../../services/ConsultaService';
import { PacienteService } from '../../services/PacienteService';
import DashboardCard from './DashboardCard';
import ConsultasHoje from './ConsultasHoje';
import './Dashboard.css';

function Dashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    consultasHoje: 0,
    consultasAmanha: 0,
    pacientesTotal: 0,
    confirmacoesPendentes: 0
  });
  const [consultasHoje, setConsultasHoje] = useState([]);
  const [loading, setLoading] = useState(true);

  const consultaService = new ConsultaService();
  const pacienteService = new PacienteService();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // Buscar estatísticas
      const [consultasHojeData, consultasAmanhaData, pacientesData, consultasPendentes] = await Promise.all([
        consultaService.getConsultasPorData(hoje),
        consultaService.getConsultasPorData(amanha),
        pacienteService.getTotalPacientes(userData.clinicaId),
        consultaService.getConsultasPendentesConfirmacao(userData.clinicaId)
      ]);

      setStats({
        consultasHoje: consultasHojeData.length,
        consultasAmanha: consultasAmanhaData.length,
        pacientesTotal: pacientesData,
        confirmacoesPendentes: consultasPendentes.length
      });

      setConsultasHoje(consultasHojeData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <h2>Olá, {userData?.nome}!</h2>
        <p>Bem-vindo(a) ao MediAgenda. Aqui está o resumo do seu dia:</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="dashboard-stats">
        <DashboardCard
          title="Consultas Hoje"
          value={stats.consultasHoje}
          icon="📅"
          color="blue"
        />
        <DashboardCard
          title="Consultas Amanhã"
          value={stats.consultasAmanha}
          icon="📆"
          color="green"
        />
        <DashboardCard
          title="Total de Pacientes"
          value={stats.pacientesTotal}
          icon="👥"
          color="purple"
        />
        <DashboardCard
          title="Confirmações Pendentes"
          value={stats.confirmacoesPendentes}
          icon="⏰"
          color="orange"
        />
      </div>

      {/* Consultas de Hoje */}
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>Consultas de Hoje</h3>
          <ConsultasHoje consultas={consultasHoje} />
        </div>

        {/* Ações Rápidas */}
        <div className="dashboard-section">
          <h3>Ações Rápidas</h3>
          <div className="quick-actions">
            <button className="quick-action-btn">
              ➕ Nova Consulta
            </button>
            <button className="quick-action-btn">
              👤 Novo Paciente
            </button>
            <button className="quick-action-btn">
              📱 Enviar Lembretes
            </button>
            <button className="quick-action-btn">
              📊 Ver Relatórios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

// =====================================
// AGENDA COMPONENT
// =====================================

// src/components/Agenda/Agenda.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import { useAuth } from '../../contexts/AuthContext';
import { ConsultaService } from '../../services/ConsultaService';
import { MedicoService } from '../../services/MedicoService';
import AgendamentoModal from './AgendamentoModal';
import DetalhesConsultaModal from './DetalhesConsultaModal';
import './Agenda.css';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

function Agenda() {
  const { userData } = useAuth();
  const [events, setEvents] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [selectedMedico, setSelectedMedico] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const consultaService = new ConsultaService();
  const medicoService = new MedicoService();

  useEffect(() => {
    loadData();
  }, [currentDate, selectedMedico]);

  const loadData = async () => {
    try {
      // Carregar médicos
      const medicosData = await medicoService.getMedicosPorClinica(userData.clinicaId);
      setMedicos(medicosData);

      // Carregar consultas
      const startDate = moment(currentDate).startOf(view).toDate();
      const endDate = moment(currentDate).endOf(view).toDate();
      
      let consultasData;
      if (selectedMedico === 'all') {
        consultasData = await consultaService.getConsultasPorPeriodo(
          userData.clinicaId, 
          startDate, 
          endDate
        );
      } else {
        consultasData = await consultaService.getConsultasPorMedicoEPeriodo(
          selectedMedico, 
          startDate, 
          endDate
        );
      }

      // Converter para formato do calendar
      const events = consultasData.map(consulta => ({
        id: consulta.id,
        title: `${consulta.pacienteNome} - ${consulta.medicoNome}`,
        start: consulta.dataHora.toDate(),
        end: moment(consulta.dataHora.toDate()).add(consulta.duracao, 'minutes').toDate(),
        resource: {
          consulta,
          status: consulta.status
        }
      }));

      setEvents(events);
    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedSlot({ start, end });
    setShowAgendamentoModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource.consulta);
    setShowDetalhesModal(true);
  };

  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    let backgroundColor = '#3174ad';
    
    switch (status) {
      case 'confirmada':
        backgroundColor = '#28a745';
        break;
      case 'agendada':
        backgroundColor = '#ffc107';
        break;
      case 'cancelada':
        backgroundColor = '#dc3545';
        break;
      case 'realizada':
        backgroundColor = '#6c757d';
        break;
      default:
        backgroundColor = '#3174ad';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '3px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há consultas neste período',
    showMore: total => `+ Ver mais (${total})`
  };

  if (loading) {
    return <div className="loading">Carregando agenda...</div>;
  }

  return (
    <div className="agenda">
      {/* Filtros */}
      <div className="agenda-filters">
        <div className="filter-group">
          <label>Médico:</label>
          <select 
            value={selectedMedico} 
            onChange={(e) => setSelectedMedico(e.target.value)}
          >
            <option value="all">Todos os médicos</option>
            {medicos.map(medico => (
              <option key={medico.id} value={medico.id}>
                {medico.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="view-buttons">
          <button 
            className={view === 'day' ? 'active' : ''}
            onClick={() => setView('day')}
          >
            Dia
          </button>
          <button 
            className={view === 'week' ? 'active' : ''}
            onClick={() => setView('week')}
          >
            Semana
          </button>
          <button 
            className={view === 'month' ? 'active' : ''}
            onClick={() => setView('month')}
          >
            Mês
          </button>
        </div>

        <button 
          className="new-appointment-btn"
          onClick={() => setShowAgendamentoModal(true)}
        >
          ➕ Nova Consulta
        </button>
      </div>

      {/* Legenda */}
      <div className="agenda-legend">
        <div className="legend-item">
          <span className="legend-color status-agendada"></span>
          Agendada
        </div>
        <div className="legend-item">
          <span className="legend-color status-confirmada"></span>
          Confirmada
        </div>
        <div className="legend-item">
          <span className="legend-color status-cancelada"></span>
          Cancelada
        </div>
        <div className="legend-item">
          <span className="legend-color status-realizada"></span>
          Realizada
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          popup
          views={['month', 'week', 'day']}
          view={view}
          onView={setView}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          min={new Date(2024, 0, 1, 7, 0)} // 7:00 AM
          max={new Date(2024, 0, 1, 20, 0)} // 8:00 PM
          step={30}
          timeslots={2}
        />
      </div>

      {/* Modais */}
      {showAgendamentoModal && (
        <AgendamentoModal
          isOpen={showAgendamentoModal}
          onClose={() => {
            setShowAgendamentoModal(false);
            setSelectedSlot(null);
          }}
          selectedSlot={selectedSlot}
          medicos={medicos}
          onSuccess={loadData}
        />
      )}

      {showDetalhesModal && (
        <DetalhesConsultaModal
          isOpen={showDetalhesModal}
          onClose={() => {
            setShowDetalhesModal(false);
            setSelectedEvent(null);
          }}
          consulta={selectedEvent}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

export default Agenda;

// =====================================
// SERVIÇOS FIREBASE
// =====================================

// src/services/ConsultaService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class ConsultaService {
  
  async criarConsulta(consultaData) {
    try {
      const docRef = await addDoc(collection(db, 'consultas'), {
        ...consultaData,
        status: 'agendada',
        confirmacao: {
          whatsappEnviado: false,
          dataEnvio: null,
          confirmadoEm: null,
          confirmadoPor: null
        },
        historico: [{
          acao: 'agendada',
          usuarioId: consultaData.criadoPor,
          dataHora: Timestamp.now(),
          observacao: 'Consulta agendada no sistema'
        }],
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      throw new Error(`Erro ao criar consulta: ${error.message}`);
    }
  }

  async atualizarConsulta(consultaId, updates) {
    try {
      const consultaRef = doc(db, 'consultas', consultaId);
      await updateDoc(consultaRef, {
        ...updates,
        atualizadoEm: Timestamp.now()
      });
    } catch (error) {
      throw new Error(`Erro ao atualizar consulta: ${error.message}`);
    }
  }

  async getConsultasPorData(data) {
    try {
      const startOfDay = new Date(data);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(data);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'consultas'),
        where('dataHora', '>=', Timestamp.fromDate(startOfDay)),
        where('dataHora', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('dataHora', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar consultas por data: ${error.message}`);
    }
  }

  async getConsultasPorPeriodo(clinicaId, startDate, endDate) {
    try {
      const q = query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('dataHora', '>=', Timestamp.fromDate(startDate)),
        where('dataHora', '<=', Timestamp.fromDate(endDate)),
        orderBy('dataHora', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar consultas por período: ${error.message}`);
    }
  }

  async getConsultasPendentesConfirmacao(clinicaId) {
    try {
      const q = query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('status', '==', 'agendada'),
        where('confirmacao.whatsappEnviado', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar consultas pendentes: ${error.message}`);
    }
  }

  async confirmarConsulta(consultaId, confirmadoPor = 'recepcionista') {
    try {
      await this.atualizarConsulta(consultaId, {
        status: 'confirmada',
        'confirmacao.confirmadoEm': Timestamp.now(),
        'confirmacao.confirmadoPor': confirmadoPor
      });
    } catch (error) {
      throw new Error(`Erro ao confirmar consulta: ${error.message}`);
    }
  }

  async cancelarConsulta(consultaId, motivo = '') {
    try {
      await this.atualizarConsulta(consultaId, {
        status: 'cancelada',
        motivoCancelamento: motivo
      });
    } catch (error) {
      throw new Error(`Erro ao cancelar consulta: ${error.message}`);
    }
  }
}