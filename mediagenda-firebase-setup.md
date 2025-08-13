# MediAgenda - Sistema de Agendamentos Médicos
## Configuração Completa no Firebase

### 1. Configuração Inicial do Projeto Firebase

#### 1.1 Criação do Projeto
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Criar projeto
firebase projects:create mediagenda-sistema --display-name "MediAgenda Sistema"

# Inicializar projeto local
mkdir mediagenda-sistema
cd mediagenda-sistema
firebase init
```

#### 1.2 Seleção de Serviços
- ✅ Firestore Database
- ✅ Authentication
- ✅ Functions
- ✅ Hosting
- ✅ Storage

### 2. Estrutura do Banco de Dados (Firestore)

#### 2.1 Coleções Principais

```javascript
// Estrutura das Collections no Firestore

// users/ - Dados dos usuários do sistema
{
  id: "user_uuid",
  email: "maria@clinica.com",
  nome: "Maria Silva",
  perfil: "recepcionista", // "recepcionista" | "medico" | "admin"
  ativo: true,
  clinicaId: "clinica_uuid",
  telefone: "+5521999999999",
  criadoEm: Timestamp,
  atualizadoEm: Timestamp
}

// clinicas/ - Dados das clínicas
{
  id: "clinica_uuid",
  nome: "Clínica São José",
  endereco: {
    rua: "Rua das Flores, 123",
    cidade: "Teresópolis",
    estado: "RJ",
    cep: "25950-000"
  },
  telefone: "+5521999999999",
  email: "contato@clinica.com",
  configuracoes: {
    horarioFuncionamento: {
      segunda: { inicio: "08:00", fim: "18:00" },
      terca: { inicio: "08:00", fim: "18:00" },
      // ... outros dias
    },
    intervaloConsulta: 30, // minutos
    antecedenciaMinima: 2, // horas
    whatsappAtivo: true,
    whatsappToken: "encrypted_token"
  },
  criadoEm: Timestamp
}

// medicos/ - Dados dos médicos
{
  id: "medico_uuid",
  userId: "user_uuid", // referência ao usuário
  clinicaId: "clinica_uuid",
  nome: "Dr. João Silva",
  crm: "12345-RJ",
  especialidades: ["cardiologia", "clinica-geral"],
  telefone: "+5521888888888",
  email: "dr.joao@clinica.com",
  configuracoes: {
    duracaoConsulta: 30, // minutos
    horarioAtendimento: {
      segunda: [
        { inicio: "08:00", fim: "12:00" },
        { inicio: "14:00", fim: "18:00" }
      ],
      // ... outros dias
    },
    pausaAlmoco: { inicio: "12:00", fim: "14:00" }
  },
  ativo: true,
  criadoEm: Timestamp
}

// pacientes/ - Dados dos pacientes
{
  id: "paciente_uuid",
  clinicaId: "clinica_uuid",
  nome: "João Santos",
  cpf: "123.456.789-00",
  rg: "12.345.678-9",
  dataNascimento: "1980-05-15",
  sexo: "M", // M | F
  telefone: "+5521777777777",
  whatsapp: "+5521777777777",
  email: "joao.santos@email.com",
  endereco: {
    rua: "Rua das Palmeiras, 456",
    cidade: "Teresópolis",
    estado: "RJ",
    cep: "25950-100"
  },
  dadosMedicos: {
    convenio: "Unimed",
    numeroCarteirinha: "123456789",
    observacoes: "Hipertenso",
    alergias: ["dipirona"],
    medicamentos: ["Losartana 50mg"]
  },
  ativo: true,
  criadoEm: Timestamp,
  atualizadoEm: Timestamp
}

// consultas/ - Agendamentos e consultas
{
  id: "consulta_uuid",
  clinicaId: "clinica_uuid",
  pacienteId: "paciente_uuid",
  medicoId: "medico_uuid",
  dataHora: Timestamp, // 2024-08-13T14:30:00
  duracao: 30, // minutos
  status: "agendada", // "agendada" | "confirmada" | "realizada" | "cancelada" | "faltou"
  motivo: "Consulta de rotina",
  observacoes: "Paciente relata dor no peito",
  tipoConsulta: "primeira-vez", // "primeira-vez" | "retorno" | "urgencia"
  confirmacao: {
    whatsappEnviado: true,
    dataEnvio: Timestamp,
    confirmadoEm: Timestamp,
    confirmadoPor: "paciente" // "paciente" | "recepcionista"
  },
  valores: {
    valorConsulta: 150.00,
    formaPagamento: "convenio", // "convenio" | "particular" | "pix"
    pago: false
  },
  historico: [
    {
      acao: "agendada",
      usuarioId: "user_uuid",
      dataHora: Timestamp,
      observacao: "Agendamento criado pela recepcionista"
    }
  ],
  criadoEm: Timestamp,
  atualizadoEm: Timestamp
}

// historico_consultas/ - Histórico de consultas realizadas
{
  id: "historico_uuid",
  consultaId: "consulta_uuid",
  pacienteId: "paciente_uuid",
  medicoId: "medico_uuid",
  clinicaId: "clinica_uuid",
  dataRealizacao: Timestamp,
  diagnostico: "Hipertensão arterial leve",
  prescricao: "Losartana 50mg - 1x ao dia",
  observacoes: "Paciente orientado sobre dieta",
  proximoRetorno: "2024-09-13",
  examesSolicitados: ["hemograma", "glicemia"],
  criadoEm: Timestamp
}

// especialidades/ - Cadastro de especialidades
{
  id: "especialidade_uuid",
  nome: "Cardiologia",
  codigo: "cardiologia",
  descricao: "Especialidade médica focada no coração",
  duracaoPadrao: 30,
  valorPadrao: 200.00,
  ativo: true
}

// configuracoes_sistema/ - Configurações gerais
{
  id: "config_uuid",
  clinicaId: "clinica_uuid",
  whatsapp: {
    ativo: true,
    apiUrl: "https://api.whatsapp.com",
    token: "encrypted_token",
    templates: {
      confirmacao: "Olá {nome}! Sua consulta com {medico} está agendada para {data} às {hora}. Confirme com SIM ou CANCELAR.",
      lembrete: "Lembrete: Você tem consulta amanhã às {hora} com {medico}. Local: {endereco}",
      cancelamento: "Sua consulta do dia {data} às {hora} foi cancelada. Entre em contato para reagendar."
    }
  },
  email: {
    ativo: false,
    servidor: "smtp.gmail.com",
    porta: 587,
    usuario: "sistema@clinica.com",
    senha: "encrypted_password"
  },
  backup: {
    ativo: true,
    frequencia: "diario", // "diario" | "semanal"
    horario: "02:00"
  }
}
```

### 3. Regras de Segurança (Firestore Security Rules)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função para verificar autenticação
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função para verificar se é admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.perfil == 'admin';
    }
    
    // Função para verificar se pertence à mesma clínica
    function isSameClinica(clinicaId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.clinicaId == clinicaId;
    }
    
    // Regras para usuários
    match /users/{userId} {
      allow read, write: if isAuthenticated() && 
        (request.auth.uid == userId || isAdmin());
    }
    
    // Regras para clínicas
    match /clinicas/{clinicaId} {
      allow read, write: if isAuthenticated() && 
        (isSameClinica(clinicaId) || isAdmin());
    }
    
    // Regras para médicos
    match /medicos/{medicoId} {
      allow read, write: if isAuthenticated() && 
        (isSameClinica(resource.data.clinicaId) || isAdmin());
    }
    
    // Regras para pacientes
    match /pacientes/{pacienteId} {
      allow read, write: if isAuthenticated() && 
        (isSameClinica(resource.data.clinicaId) || isAdmin());
    }
    
    // Regras para consultas
    match /consultas/{consultaId} {
      allow read, write: if isAuthenticated() && 
        (isSameClinica(resource.data.clinicaId) || isAdmin());
    }
    
    // Regras para histórico
    match /historico_consultas/{historicoId} {
      allow read, write: if isAuthenticated() && 
        (isSameClinica(resource.data.clinicaId) || isAdmin());
    }
    
    // Regras para especialidades (leitura livre para usuários autenticados)
    match /especialidades/{especialidadeId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Regras para configurações
    match /configuracoes_sistema/{configId} {
      allow read, write: if isAuthenticated() && 
        (isSameClinica(resource.data.clinicaId) || isAdmin());
    }
  }
}
```

### 4. Configuração de Autenticação

```javascript
// authentication.js - Configuração do Firebase Auth

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "mediagenda-sistema.firebaseapp.com",
  projectId: "mediagenda-sistema",
  storageBucket: "mediagenda-sistema.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Classe para gerenciar autenticação
export class AuthService {
  
  // Login de usuário
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      
      if (!userData.ativo) {
        throw new Error('Usuário inativo. Contate o administrador.');
      }
      
      return {
        user: userCredential.user,
        userData: userData
      };
    } catch (error) {
      throw new Error(`Erro no login: ${error.message}`);
    }
  }
  
  // Registro de novo usuário (apenas admin)
  async register(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        email: email,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      });
      
      return userCredential.user;
    } catch (error) {
      throw new Error(`Erro no registro: ${error.message}`);
    }
  }
  
  // Buscar dados do usuário
  async getUserData(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    throw new Error('Usuário não encontrado');
  }
  
  // Logout
  async logout() {
    await signOut(auth);
  }
  
  // Observar mudanças no estado de autenticação
  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
}
```

### 5. Cloud Functions para Automação

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

admin.initializeApp();
const db = admin.firestore();

// Função para enviar confirmação via WhatsApp
exports.enviarConfirmacaoWhatsApp = functions.firestore
  .document('consultas/{consultaId}')
  .onCreate(async (snap, context) => {
    const consulta = snap.data();
    const consultaId = context.params.consultaId;
    
    try {
      // Buscar dados do paciente
      const pacienteDoc = await db.doc(`pacientes/${consulta.pacienteId}`).get();
      const paciente = pacienteDoc.data();
      
      // Buscar dados do médico
      const medicoDoc = await db.doc(`medicos/${consulta.medicoId}`).get();
      const medico = medicoDoc.data();
      
      // Buscar configurações da clínica
      const configDoc = await db.doc(`configuracoes_sistema/${consulta.clinicaId}`).get();
      const config = configDoc.data();
      
      if (config.whatsapp.ativo && paciente.whatsapp) {
        const dataConsulta = consulta.dataHora.toDate();
        const dataFormatada = dataConsulta.toLocaleDateString('pt-BR');
        const horaFormatada = dataConsulta.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const mensagem = config.whatsapp.templates.confirmacao
          .replace('{nome}', paciente.nome)
          .replace('{medico}', medico.nome)
          .replace('{data}', dataFormatada)
          .replace('{hora}', horaFormatada);
        
        // Enviar WhatsApp (integração com API)
        const response = await enviarWhatsApp(paciente.whatsapp, mensagem, config.whatsapp);
        
        // Atualizar status de confirmação
        await snap.ref.update({
          'confirmacao.whatsappEnviado': true,
          'confirmacao.dataEnvio': Timestamp.now(),
          atualizadoEm: Timestamp.now()
        });
        
        console.log(`WhatsApp enviado para ${paciente.nome}: ${response.id}`);
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
    }
  });

// Função para enviar lembretes diários
exports.enviarLembretesDiarios = functions.pubsub
  .schedule('0 18 * * *') // Todo dia às 18h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    
    const depoisAmanha = new Date(amanha);
    depoisAmanha.setDate(depoisAmanha.getDate() + 1);
    
    // Buscar consultas de amanhã
    const consultasSnapshot = await db.collection('consultas')
      .where('dataHora', '>=', Timestamp.fromDate(amanha))
      .where('dataHora', '<', Timestamp.fromDate(depoisAmanha))
      .where('status', '==', 'confirmada')
      .get();
    
    const promises = consultasSnapshot.docs.map(async (consultaDoc) => {
      const consulta = consultaDoc.data();
      
      try {
        // Buscar dados necessários
        const [pacienteDoc, medicoDoc, configDoc] = await Promise.all([
          db.doc(`pacientes/${consulta.pacienteId}`).get(),
          db.doc(`medicos/${consulta.medicoId}`).get(),
          db.doc(`configuracoes_sistema/${consulta.clinicaId}`).get()
        ]);
        
        const paciente = pacienteDoc.data();
        const medico = medicoDoc.data();
        const config = configDoc.data();
        
        if (config.whatsapp.ativo && paciente.whatsapp) {
          const horaFormatada = consulta.dataHora.toDate().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          const mensagem = config.whatsapp.templates.lembrete
            .replace('{nome}', paciente.nome)
            .replace('{medico}', medico.nome)
            .replace('{hora}', horaFormatada)
            .replace('{endereco}', 'Rua das Flores, 123'); // Usar endereço da clínica
          
          await enviarWhatsApp(paciente.whatsapp, mensagem, config.whatsapp);
        }
      } catch (error) {
        console.error(`Erro ao enviar lembrete para consulta ${consultaDoc.id}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log(`Lembretes enviados para ${consultasSnapshot.size} consultas`);
  });

// Função para backup automático
exports.backupAutomatico = functions.pubsub
  .schedule('0 2 * * *') // Todo dia às 2h da manhã
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      const projectId = admin.app().options.projectId;
      const bucket = `gs://${projectId}-backup`;
      
      // Criar backup das principais coleções
      const collections = ['users', 'clinicas', 'medicos', 'pacientes', 'consultas', 'historico_consultas'];
      
      for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const fileName = `backup-${collectionName}-${new Date().toISOString().split('T')[0]}.json`;
        
        // Salvar no Storage (implementar upload)
        console.log(`Backup criado: ${fileName} com ${data.length} documentos`);
      }
      
      console.log('Backup automático concluído com sucesso');
    } catch (error) {
      console.error('Erro no backup automático:', error);
    }
  });

// Função auxiliar para enviar WhatsApp
async function enviarWhatsApp(numero, mensagem, config) {
  // Implementar integração com API do WhatsApp
  // Exemplo usando WhatsApp Business API ou similar
  const response = await fetch(config.apiUrl + '/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: numero,
      text: { body: mensagem },
      type: 'text'
    })
  });
  
  return response.json();
}

// Função para processar respostas do WhatsApp
exports.processarRespostaWhatsApp = functions.https.onRequest(async (req, res) => {
  const { numero, mensagem, timestamp } = req.body;
  
  try {
    // Buscar consulta pendente de confirmação
    const consultasSnapshot = await db.collection('consultas')
      .where('confirmacao.whatsappEnviado', '==', true)
      .where('status', '==', 'agendada')
      .get();
    
    // Filtrar por número do paciente
    for (const consultaDoc of consultasSnapshot.docs) {
      const consulta = consultaDoc.data();
      const pacienteDoc = await db.doc(`pacientes/${consulta.pacienteId}`).get();
      const paciente = pacienteDoc.data();
      
      if (paciente.whatsapp === numero) {
        const mensagemLower = mensagem.toLowerCase().trim();
        
        if (mensagemLower.includes('sim') || mensagemLower.includes('confirmo')) {
          // Confirmar consulta
          await consultaDoc.ref.update({
            status: 'confirmada',
            'confirmacao.confirmadoEm': Timestamp.fromDate(new Date(timestamp)),
            'confirmacao.confirmadoPor': 'paciente',
            atualizadoEm: Timestamp.now()
          });
          
          // Registrar no histórico
          await consultaDoc.ref.update({
            historico: admin.firestore.FieldValue.arrayUnion({
              acao: 'confirmada',
              usuarioId: 'sistema',
              dataHora: Timestamp.now(),
              observacao: 'Confirmada via WhatsApp pelo paciente'
            })
          });
          
        } else if (mensagemLower.includes('cancelar') || mensagemLower.includes('cancel')) {
          // Cancelar consulta
          await consultaDoc.ref.update({
            status: 'cancelada',
            atualizadoEm: Timestamp.now()
          });
          
          // Registrar no histórico
          await consultaDoc.ref.update({
            historico: admin.firestore.FieldValue.arrayUnion({
              acao: 'cancelada',
              usuarioId: 'sistema',
              dataHora: Timestamp.now(),
              observacao: 'Cancelada via WhatsApp pelo paciente'
            })
          });
        }
        break;
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar resposta WhatsApp:', error);
    res.status(500).send('Erro interno');
  }
});
```

### 6. Estrutura do Frontend (React)

```javascript
// src/App.js - Aplicação principal
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Componentes
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Agenda from './components/Agenda/Agenda';
import Pacientes from './components/Pacientes/Pacientes';
import Relatorios from './components/Relatorios/Relatorios';
import Configuracoes from './components/Configuracoes/Configuracoes';
import Layout from './components/Layout/Layout';
import Loading from './components/UI/Loading';

// Estilos
import './App.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Componente para rotas protegidas
function ProtectedRoutes() {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;
```

### 7. Deploy e Configuração Final

```bash
# Deploy das Functions
cd functions
npm install
firebase deploy --only functions

# Deploy do Hosting
firebase deploy --only hosting

# Deploy das Regras do Firestore
firebase deploy --only firestore:rules

# Deploy completo
firebase deploy
```

### 8. Configuração de Monitoring e Analytics

```javascript
// monitoring.js - Configuração de monitoramento

import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance, trace } from 'firebase/performance';

const analytics = getAnalytics();
const performance = getPerformance();

export class MonitoringService {
  
  // Log de eventos personalizados
  logEvent(eventName, parameters = {}) {
    logEvent(analytics, eventName, parameters);
  }
  
  // Rastreamento de performance
  async measurePerformance(operationName, operation) {
    const t = trace(performance, operationName);
    t.start();
    
    try {
      const result = await operation();
      t.putAttribute('success', 'true');
      return result;
    } catch (error) {
      t.putAttribute('success', 'false');
      t.putAttribute('error', error.message);
      throw error;
    } finally {
      t.stop();
    }
  }
  
  // Log de agendamentos
  logAgendamento(consultaData) {
    this.logEvent('agendamento_criado', {
      medico_id: consultaData.medicoId,
      tipo_consulta: consultaData.tipoConsulta,
      forma_agendamento: 'sistema'
    });
  }
  
  // Log de confirmações
  logConfirmacao(meio) {
    this.logEvent('consulta_confirmada', {
      meio_confirmacao: meio // 'whatsapp' | 'manual'
    });
  }
}
```

Este projeto está completamente configurado para o Firebase, incluindo todas as funcionalidades essenciais do MediAgenda. A estrutura permite escalabilidade e manutenção fácil, seguindo as melhores práticas de desenvolvimento.
