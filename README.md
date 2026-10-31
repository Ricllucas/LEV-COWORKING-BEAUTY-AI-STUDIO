# 🌟 LEV Coworking Beauty - Sistema de Agendamentos IA

**Uma plataforma completa para gerenciamento de agendamentos em salão de beleza com automação via WhatsApp e Google Agenda.**

---

## 🎯 O Que É?

O **LEV Coworking Beauty** é um sistema web full-stack que permite:

- ✅ **Clientes**: Agendar serviços 24/7 através de uma landing page intuitiva
- ✅ **Profissionais**: Gerenciar sua agenda, clientes e serviços
- ✅ **Administrador**: Visão geral da operação, relatórios e gerenciamento de usuários
- ✅ **Automação**: Confirmações e lembretes automáticos via WhatsApp
- ✅ **Integração**: Google Calendar sincronizado com equipe em tempo real
- ✅ **IA**: Respostas inteligentes a mensagens de clientes (Google Gemini)

---

## 🏗️ Stack Tecnológico

### Frontend
- **React 19** - UI moderna e responsiva
- **TypeScript** - Type safety
- **Tailwind CSS** - Design system elegante
- **Vite** - Build system rápido

### Backend
- **Vercel API Routes** - Serverless functions
- **Supabase** - Database real-time + auth
- **Google Calendar API** - Sincronização de agenda
- **WhatsApp Business API** - Automação de mensagens
- **Google Gemini** - Respostas IA

### Testes & Deploy
- **Playwright** - E2E tests
- **Vitest** - Unit tests
- **Vercel** - Deployment contínuo

---

## 📁 Estrutura do Projeto

```
LEV-COWORKING-BEAUTY-AI-STUDIO/
│
├── 📄 README.md                      # Este arquivo
├── 📄 CLAUDE.md                      # Contexto para Claude
├── 📄 .env.example                   # Variáveis de ambiente
│
├── 📁 docs/                          # 📚 DOCUMENTAÇÃO CENTRALIZADA
│   ├── guides/                       # 📖 Guias de setup
│   │   ├── SETUP_INICIAL.md
│   │   ├── WHATSAPP_*.md
│   │   ├── GOOGLE_CALENDAR_*.md
│   │   └── DEPLOYMENT_*.md
│   ├── reference/                    # 📋 Referência técnica
│   │   ├── VARIÁVEIS_AMBIENTE.md
│   │   ├── API_ENDPOINTS.md
│   │   └── DATABASE_SCHEMA.md
│   ├── reports/                      # 📊 Relatórios
│   │   ├── CODE_REVIEW.md
│   │   └── PROGRESS.md
│   ├── checklists/                   # ✅ Checklists
│   │   └── DEPLOYMENT_CHECKLIST.md
│   └── test-reports/                 # 🧪 Resultados de testes
│
├── 📁 src/                           # 💻 CÓDIGO FONTE
│   ├── components/                   # React components (41 componentes)
│   ├── services/                     # Lógica de negócio
│   ├── context/                      # State management (Context API)
│   ├── types/                        # Tipos TypeScript
│   ├── utils/                        # Funções utilitárias
│   └── App.tsx                       # Componente raiz
│
├── 📁 api/                           # 🔌 VERCEL SERVERLESS
│   ├── _lib/                         # Bibliotecas compartilhadas
│   ├── whatsapp/                     # Webhooks WhatsApp
│   ├── clients/                      # CRUD de clientes
│   ├── appointments/                 # CRUD de agendamentos
│   └── cron/                         # Tarefas agendadas
│
├── 📁 e2e/                           # 🧪 TESTES E2E (Playwright)
├── 📁 scripts/                       # 🚀 Scripts de automação
├── 📁 public/                        # 🎨 Assets públicos
├── 📁 supabase/                      # 🗄️ Configuração database
│
├── 📄 vite.config.ts                 # Config Vite
├── 📄 tailwind.config.ts             # Config Tailwind
├── 📄 playwright.config.ts           # Config Playwright
├── 📄 tsconfig.json                  # Config TypeScript
└── 📄 package.json                   # Dependências
```

---

## 🚀 Início Rápido

### 1. **Setup Inicial (10 min)**
```bash
# Clonar repositório
git clone <repo-url>
cd LEV-COWORKING-BEAUTY-AI-STUDIO

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Rodar localmente
npm run dev
# Abre em http://localhost:3000
```

**📖 Documentação:** Ver `docs/guides/SETUP_INICIAL.md`

---

### 2. **Configurar Integrações (30 min)**

#### WhatsApp Business
1. Pegar credenciais Meta → `docs/guides/SETUP_CREDENCIAIS_META.md`
2. Configurar Vercel → `docs/guides/SETUP_VERCEL.md`
3. Validar → `npx tsx scripts/validate-whatsapp.ts`

**📖 Documentação:** Ver `docs/guides/WHATSAPP_SETUP.md`

#### Google Calendar
1. Service Account JWT → `docs/guides/GOOGLE_CALENDAR_SETUP.md`
2. Compartilhar agenda com profissionais
3. Sincronizar agendamentos

**📖 Documentação:** Ver `docs/guides/GOOGLE_CALENDAR_DETALHADO.md`

---

### 3. **Deploy em Produção**

```bash
# Verificar checklist
cat docs/checklists/DEPLOYMENT_CHECKLIST.md

# Deploy automático ao fazer push
git push origin main
# Vercel detecta e faz deploy automaticamente
```

**📖 Documentação:** Ver `docs/guides/DEPLOYMENT_GUIDE.md`

---

## 📊 Progresso do Projeto

| Feature | Status | Documentação |
|---------|--------|--------------|
| ✅ Frontend React | Completo | `src/components/` |
| ✅ Multi-role Auth | Completo | `docs/reference/` |
| ✅ Booking Modal | Completo | `docs/guides/` |
| ✅ Dashboard Profissionais | Completo | `src/components/dashboard/` |
| ✅ Admin Dashboard | Completo | `src/components/admin/` |
| ✅ Supabase Integration | Completo | `docs/reference/` |
| ✅ Google Calendar | Completo | `docs/guides/GOOGLE_CALENDAR_DETALHADO.md` |
| ✅ WhatsApp Automação | Configurando | `docs/guides/WHATSAPP_SETUP.md` |
| ✅ IA (Gemini) | Completo | `src/services/gemini/` |
| ✅ Tests E2E | Completo | `docs/reference/TESTES_E2E_GUIA.md` |

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Rodar app local
npm run build            # Build production
npm run preview          # Preview build local

# Testes
npm run test             # Unit tests (Vitest)
npm run test:ui          # Unit tests com UI
npm run e2e              # E2E tests (Playwright)
npm run e2e:ui           # E2E tests com UI

# Validação
npm run lint             # TypeScript lint
npx tsx scripts/validate-whatsapp.ts  # Validar WhatsApp
```

---

## 📚 Documentação Completa

### 📖 Guias de Setup
- **SETUP_INICIAL.md** - Primeiros passos
- **WHATSAPP_SETUP.md** - Configurar WhatsApp Business
- **GOOGLE_CALENDAR_SETUP.md** - Integrar Google Agenda
- **DEPLOYMENT_GUIDE.md** - Deploy em produção

### 📋 Referência Técnica
- **VARIÁVEIS_AMBIENTE.md** - Todas as env vars explicadas
- **API_ENDPOINTS.md** - Endpoints disponíveis
- **DATABASE_SCHEMA.md** - Schema do Supabase

### 📊 Relatórios
- **CODE_REVIEW.md** - Review completo do código (2026-08-01)
- **PROGRESS.md** - Status do projeto

### ✅ Checklists
- **DEPLOYMENT_CHECKLIST.md** - Antes de ir para produção

---

## 🤝 Padrões de Código

### TypeScript
- 100% tipado
- Sem `any` ou `as`
- Interfaces explícitas

### React
- Functional components com hooks
- Context API para state global
- Custom hooks para lógica reutilizável

### Testes
- E2E com Playwright
- Unit tests com Vitest
- Coverage > 80%

---

## 🔐 Segurança

- ✅ Nenhuma secret em código
- ✅ Variáveis em `.env.local`
- ✅ Service role key apenas em Vercel
- ✅ Validação em todos os endpoints
- ✅ CORS configurado corretamente

---

## 🐛 Encontrou um Bug?

1. Abra uma issue com:
   - Descrição clara
   - Passos para reproduzir
   - Screenshot/video se possível

2. Ou faça um PR com a fix!

---

## 📞 Suporte

- 📧 Email: ricllucas@gmail.com
- 💬 WhatsApp: (41) 98497-9940
- 📍 Localização: Curitiba, PR

---

## 📅 Roadmap

**Q4 2026:**
- [x] Automação WhatsApp completa
- [x] Google Calendar integrado
- [x] E2E tests
- [ ] Machine learning para recomendações
- [ ] App mobile (React Native)

---

## 📄 Licença

Propriedade de LEV Coworking Beauty

---

**Última atualização:** 31/10/2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Produção

*Para mais informações, consulte a documentação em `docs/`*
