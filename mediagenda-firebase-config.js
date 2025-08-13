// =====================================
// CONFIGURAÇÃO DO FIREBASE
// =====================================

// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const performance = getPerformance(app);

export default app;

// =====================================
// ARQUIVO .ENV (TEMPLATE)
// =====================================

// .env.example
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=mediagenda-sistema.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=mediagenda-sistema
REACT_APP_FIREBASE_STORAGE_BUCKET=mediagenda-sistema.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# WhatsApp API Configuration
REACT_APP_WHATSAPP_API_URL=https://api.whatsapp.com
REACT_APP_WHATSAPP_TOKEN=your-whatsapp-token

# Environment
REACT_APP_ENVIRONMENT=development

// =====================================
// FIREBASE.JSON (CONFIGURAÇÃO)
// =====================================

{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint",
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  }
}

// =====================================
// ÍNDICES DO FIRESTORE
// =====================================

// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "consultas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "clinicaId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dataHora",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "medicoId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dataHora",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "pacienteId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dataHora",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dataHora",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "clinicaId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "confirmacao.whatsappEnviado",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}

// =====================================
// REGRAS DO STORAGE
// =====================================

// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Regras para documentos de pacientes
    match /documentos/{clinicaId}/{pacienteId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        resource.data.clinicaId == clinicaId &&
        isAuthorizedForClinica(clinicaId);
    }
    
    // Regras para backups (apenas admin)
    match /backups/{allPaths=**} {
      allow read, write: if request.auth != null && 
        isAdmin();
    }
    
    // Regras para uploads temporários
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Funções auxiliares
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.perfil == 'admin';
    }
    
    function isAuthorizedForClinica(clinicaId) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.clinicaId == clinicaId;
    }
  }
}

// =====================================
// SCRIPT DE INICIALIZAÇÃO
// =====================================

// scripts/setup.js
const admin = require('firebase-admin');
const readline = require('readline');

// Configurar o SDK Admin
const serviceAccount = require('../mediagenda-sistema-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mediagenda-sistema-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupInitialData() {
  console.log('🚀 Iniciando configuração do MediAgenda...\n');
  
  // 1. Criar especialidades padrão
  await createDefaultSpecialties();
  
  // 2. Criar clínica inicial
  const clinicaId = await createInitialClinica();
  
  // 3. Criar usuário administrador
  await createAdminUser(clinicaId);
  
  // 4. Criar configurações iniciais
  await createInitialConfigurations(clinicaId);
  
  console.log('\n✅ Configuração inicial concluída com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Acesse o sistema com o email do administrador');
  console.log('2. Configure os médicos da clínica');
  console.log('3. Cadastre os primeiros pacientes');
  console.log('4. Configure a integração do WhatsApp');
  
  rl.close();
}

async function createDefaultSpecialties() {
  console.log('📚 Criando especialidades padrão...');
  
  const especialidades = [
    {
      nome: 'Clínica Geral',
      codigo: 'clinica-geral',
      descricao: 'Atendimento médico geral e preventivo',
      duracaoPadrao: 30,
      valorPadrao: 150.00,
      ativo: true
    },
    {
      nome: 'Cardiologia',
      codigo: 'cardiologia',
      descricao: 'Especialidade focada no coração e sistema cardiovascular',
      duracaoPadrao: 45,
      valorPadrao: 250.00,
      ativo: true
    },
    {
      nome: 'Dermatologia',
      codigo: 'dermatologia',
      descricao: 'Cuidados com a pele, cabelos e unhas',
      duracaoPadrao: 30,
      valorPadrao: 200.00,
      ativo: true
    },
    {
      nome: 'Ginecologia',
      codigo: 'ginecologia',
      descricao: 'Saúde da mulher e sistema reprodutivo',
      duracaoPadrao: 45,
      valorPadrao: 220.00,
      ativo: true
    },
    {
      nome: 'Pediatria',
      codigo: 'pediatria',
      descricao: 'Cuidados médicos para crianças e adolescentes',
      duracaoPadrao: 30,
      valorPadrao: 180.00,
      ativo: true
    }
  ];

  for (const especialidade of especialidades) {
    await db.collection('especialidades').add(especialidade);
  }
  
  console.log(`   ✓ ${especialidades.length} especialidades criadas`);
}

async function createInitialClinica() {
  console.log('\n🏥 Configurando clínica inicial...');
  
  return new Promise((resolve) => {
    rl.question('Nome da clínica: ', (nome) => {
      rl.question('Endereço completo: ', (endereco) => {
        rl.question('Telefone: ', (telefone) => {
          rl.question('Email: ', async (email) => {
            
            const clinicaData = {
              nome: nome,
              endereco: {
                rua: endereco,
                cidade: 'Teresópolis',
                estado: 'RJ',
                cep: '25950-000'
              },
              telefone: telefone,
              email: email,
              configuracoes: {
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
                antecedenciaMinima: 2,
                whatsappAtivo: false,
                whatsappToken: ''
              },
              criadoEm: admin.firestore.Timestamp.now()
            };

            const docRef = await db.collection('clinicas').add(clinicaData);
            console.log(`   ✓ Clínica "${nome}" criada`);
            resolve(docRef.id);
          });
        });
      });
    });
  });
}

async function createAdminUser(clinicaId) {
  console.log('\n👤 Criando usuário administrador...');
  
  return new Promise((resolve) => {
    rl.question('Email do administrador: ', (email) => {
      rl.question('Nome completo: ', (nome) => {
        rl.question('Senha: ', async (senha) => {
          
          try {
            // Criar usuário no Authentication
            const userRecord = await admin.auth().createUser({
              email: email,
              password: senha,
              displayName: nome,
              emailVerified: true
            });

            // Criar documento do usuário no Firestore
            await db.collection('users').doc(userRecord.uid).set({
              email: email,
              nome: nome,
              perfil: 'admin',
              ativo: true,
              clinicaId: clinicaId,
              telefone: '',
              criadoEm: admin.firestore.Timestamp.now(),
              atualizadoEm: admin.firestore.Timestamp.now()
            });

            console.log(`   ✓ Administrador "${nome}" criado`);
            console.log(`   ✓ UID: ${userRecord.uid}`);
            resolve();
          } catch (error) {
            console.error('Erro ao criar administrador:', error);
            resolve();
          }
        });
      });
    });
  });
}

async function createInitialConfigurations(clinicaId) {
  console.log('\n⚙️ Criando configurações iniciais...');
  
  const configData = {
    clinicaId: clinicaId,
    whatsapp: {
      ativo: false,
      apiUrl: 'https://api.whatsapp.com',
      token: '',
      templates: {
        confirmacao: 'Olá {nome}! Sua consulta com {medico} está agendada para {data} às {hora}. Confirme com SIM ou CANCELAR.',
        lembrete: 'Lembrete: Você tem consulta amanhã às {hora} com {medico}. Local: {endereco}',
        cancelamento: 'Sua consulta do dia {data} às {hora} foi cancelada. Entre em contato para reagendar.'
      }
    },
    email: {
      ativo: false,
      servidor: 'smtp.gmail.com',
      porta: 587,
      usuario: '',
      senha: ''
    },
    backup: {
      ativo: true,
      frequencia: 'diario',
      horario: '02:00'
    },
    criadoEm: admin.firestore.Timestamp.now()
  };

  await db.collection('configuracoes_sistema').add(configData);
  console.log('   ✓ Configurações iniciais criadas');
}

// Executar setup se este arquivo for executado diretamente
if (require.main === module) {
  setupInitialData().catch(console.error);
}

module.exports = {
  setupInitialData,
  createDefaultSpecialties,
  createInitialClinica,
  createAdminUser,
  createInitialConfigurations
};

// =====================================
// PACKAGE.JSON (SCRIPTS)
// =====================================

{
  "name": "mediagenda-sistema",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "firebase": "^10.8.0",
    "react-big-calendar": "^1.8.2",
    "moment": "^2.29.4",
    "date-fns": "^2.29.3",
    "react-datepicker": "^4.10.0",
    "react-select": "^5.7.0",
    "react-toastify": "^9.1.1",
    "recharts": "^2.5.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "firebase-tools": "^12.0.0",
    "firebase-admin": "^11.5.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "firebase:emulators": "firebase emulators:start",
    "firebase:deploy": "npm run build && firebase deploy",
    "firebase:deploy:hosting": "npm run build && firebase deploy --only hosting",
    "firebase:deploy:functions": "firebase deploy --only functions",
    "firebase:deploy:firestore": "firebase deploy --only firestore:rules",
    "setup:initial": "node scripts/setup.js",
    "setup:prod": "NODE_ENV=production node scripts/setup.js",
    "backup:create": "node scripts/backup.js",
    "backup:restore": "node scripts/restore.js"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

// =====================================
// SCRIPT DE DEPLOY AUTOMÁTICO
// =====================================

// scripts/deploy.sh
#!/bin/bash

echo "🚀 Iniciando deploy do MediAgenda..."

# Verificar se está na branch main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Erro: Deploy deve ser feito a partir da branch main"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    echo "❌ Erro: Há mudanças não commitadas"
    git status -s
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Executar testes
echo "🧪 Executando testes..."
npm test -- --coverage --watchAll=false

if [ $? -ne 0 ]; then
    echo "❌ Erro: Testes falharam"
    exit 1
fi

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro: Build falhou"
    exit 1
fi

# Deploy das Functions
echo "☁️ Fazendo deploy das Functions..."
firebase deploy --only functions

if [ $? -ne 0 ]; then
    echo "❌ Erro: Deploy das Functions falhou"
    exit 1
fi

# Deploy das regras do Firestore
echo "🔒 Fazendo deploy das regras do Firestore..."
firebase deploy --only firestore:rules

if [ $? -ne 0 ]; then
    echo "❌ Erro: Deploy das regras falhou"
    exit 1
fi

# Deploy do Hosting
echo "🌐 Fazendo deploy do Hosting..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    echo "❌ Erro: Deploy do Hosting falhou"
    exit 1
fi

echo "✅ Deploy concluído com sucesso!"
echo "🌍 Aplicação disponível em: https://mediagenda-sistema.web.app"

// =====================================
// DOCUMENTAÇÃO README
// =====================================

// README.md
# MediAgenda - Sistema de Agendamentos Médicos

## 📋 Descrição

O MediAgenda é uma plataforma completa de gestão de consultas médicas que conecta recepcionistas, médicos e administradores em um fluxo integrado. O sistema resolve a desorganização de agendas, reduz faltas e melhora a comunicação com pacientes através de confirmações automáticas via WhatsApp.

## 🚀 Funcionalidades

### Principais Features
- ✅ Sistema de login com três perfis (recepcionista/médico/admin)
- ✅ Cadastro completo de pacientes com dados essenciais
- ✅ Agenda visual com slots de horários configuráveis
- ✅ Confirmação automática via WhatsApp
- ✅ Histórico básico de consultas anteriores
- ✅ Relatórios de performance e estatísticas
- ✅ Gestão de múltiplas especialidades
- ✅ Backup automático de dados

### Perfis de Usuário

**Recepcionista**
- Agendar consultas rapidamente
- Ver conflitos de horário
- Confirmar presenças automaticamente
- Cadastrar novos pacientes

**Médico**
- Visualizar histórico do paciente
- Agenda organizada por especialidade
- Foco no atendimento, não na burocracia

**Administrador**
- Controle total do sistema
- Relatórios de performance
- Gestão de usuários e configurações

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, React Router, React Big Calendar
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Styling**: CSS3 com variáveis customizadas
- **Deployment**: Firebase Hosting
- **Monitoring**: Firebase Analytics e Performance

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no Firebase

### Configuração Inicial

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/mediagenda-sistema.git
cd mediagenda-sistema
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Firebase**
```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init
```

4. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

5. **Execute a configuração inicial**
```bash
npm run setup:initial
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm start
```

## 🚀 Deploy

### Deploy Completo
```bash
npm run firebase:deploy
```

### Deploy Específico
```bash
# Apenas Hosting
npm run firebase:deploy:hosting

# Apenas Functions
npm run firebase:deploy:functions

# Apenas regras do Firestore
npm run firebase:deploy:firestore
```

## 📊 Estrutura do Projeto

```
mediagenda-sistema/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Agenda/
│   │   ├── Pacientes/
│   │   └── Layout/
│   ├── contexts/
│   ├── services/
│   ├── config/
│   └── styles/
├── functions/
├── scripts/
├── firestore.rules
├── firebase.json
└── package.json
```

## 🔧 Configuração

### Firebase Configuration
Edite o arquivo `src/config/firebase.js` com suas credenciais do Firebase.

### WhatsApp Integration
Configure a integração do WhatsApp no painel administrativo:
1. Acesse Configurações → Integrações
2. Configure a API Key do WhatsApp
3. Teste o envio de mensagens

## 📈 Métricas de Sucesso

- **Taxa de presença**: Alvo de 95% (vs 70% atual)
- **Tempo de agendamento**: Reduzir de 5min para 2min por consulta
- **Confirmações automáticas**: 80% via WhatsApp sem intervenção manual
- **Satisfação recepcionistas**: NPS > 8
- **Redução de ligações**: 60% menos chamadas de confirmação

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte técnico, entre em contato:
- Email: suporte@mediagenda.com
- Telefone: (21) 99999-9999
- Documentação: [docs.mediagenda.com](https://docs.mediagenda.com)

## 🎯 Roadmap

### Fase 1 (MVP - 8 semanas) ✅
- [x] Autenticação e perfis básicos
- [x] CRUD de pacientes
- [x] Agenda simples para um médico
- [x] Confirmação manual via WhatsApp

### Fase 2 (12 semanas) 🚧
- [ ] Multi-médicos e especialidades
- [ ] Confirmação automática via API WhatsApp
- [ ] Histórico de consultas
- [ ] Dashboard básico

### Fase 3 (16 semanas) 📋
- [ ] Relatórios avançados
- [ ] Notificações push
- [ ] Otimizações de performance
- [ ] Backup automático

---

**Desenvolvido com ❤️ para revolucionar o atendimento médico**