# 🤖 CLAUDE.md - Contexto do Projeto LEV Coworking Beauty

**Documento de contexto para Claude entender o projeto rapidamente.**

---

## 🎯 Resumo Executivo

**LEV Coworking Beauty** é um sistema web para agendamentos em salão de beleza com:
- Landing page pública para clientes agendar
- Dashboard para profissionais gerenciarem agenda
- Admin dashboard com relatórios
- Automação WhatsApp + Google Calendar
- IA (Google Gemini) para respostas inteligentes

**Stack:** React 19 + TypeScript + Tailwind + Vite + Supabase + Vercel

---

## 📍 Localização do Projeto

```
/home/user/LEV-COWORKING-BEAUTY-AI-STUDIO/
├── src/                    # Código-fonte React (41 componentes)
├── api/                    # Vercel API Routes
├── docs/                   # 📚 TODA DOCUMENTAÇÃO
├── e2e/                    # Testes Playwright
├── scripts/                # Scripts de automação
└── supabase/               # Database migrations
```

---

## 🏆 O Que Já Foi Feito

### ✅ Semana 1-2: Core da App
- React components (41 total)
- TypeScript 100% tipado
- Tailwind CSS + Dark theme
- Context API + useReducer

### ✅ Semana 3: Performance
- Code splitting
- Lazy loading
- Image optimization
- useMemo/useCallback

### ✅ Semana 4: State Management
- Refactor para Context API
- useReducer pattern
- Custom hooks

### ✅ Integrations
- ✅ Supabase (database + auth)
- ✅ Google Calendar API (sincronização)
- ✅ WhatsApp Business API (automação)
- ✅ Google Gemini (respostas IA)

### ✅ Testes
- ✅ E2E com Playwright
- ✅ Unit tests com Vitest
- ✅ Code review completo

---

## 🚧 Próximos Passos

### Prioridade 1 (Imediato)
- [ ] Configurar credenciais WhatsApp no Vercel
- [ ] Validar fluxo completo E2E
- [ ] Deploy em produção

### Prioridade 2 (Curto prazo)
- [ ] Testes unitários para formatters
- [ ] Otimizar re-renders
- [ ] Error boundary + global error handler

### Prioridade 3 (Médio prazo)
- [ ] Refactor StorageService → Context
- [ ] Query invalidation
- [ ] Suspense para code splitting

---

## 🔑 Variáveis de Ambiente

```env
# Frontend (Público - Supabase)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Backend (Servidor - Vercel)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=lev@xxx.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_APP_SECRET=abc123...
WHATSAPP_VERIFY_TOKEN=MySecureToken...
```

---

## 👥 Roles do Sistema

### 1. **Cliente (Público)**
- Acessa landing page
- Visualiza profissionais e serviços
- Agenda serviço (multi-step modal)
- Recebe confirmação via WhatsApp

### 2. **Profissional**
- Login próprio
- Visualiza sua agenda
- Gerencia clientes
- Responde mensagens WhatsApp

### 3. **Admin**
- Dashboard completo
- Gerencia profissionais
- Gerencia serviços
- Visualiza relatórios

---

## 📁 Estrutura de Pastas

### `/src/components/` (41 componentes)
```
components/
├── auth/               # Login pages
├── booking/            # Sistema de agendamento
├── agenda/             # Visualização de agenda
├── dashboard/          # Dashboards por role
├── services/           # Gerenciamento de serviços
├── professionals/      # Gerenciamento de profissionais
├── financial/          # Relatórios financeiros
├── audit/              # Logs de auditoria
└── common/             # Componentes reutilizáveis
```

### `/api/` (Vercel Routes)
```
api/
├── _lib/               # Bibliotecas compartilhadas
│   ├── whatsapp.ts     # WhatsApp service
│   ├── whatsappService.ts
│   ├── notificationService.ts
│   └── whatsappValidator.ts
├── whatsapp/           # Webhooks
├── clients/            # CRUD
├── appointments/       # CRUD
└── cron/               # Tarefas agendadas
```

### `/src/services/` (Lógica de Negócio)
```
services/
├── storage/            # StorageService
├── auth/               # AuthService
├── api/                # Chamadas de API
├── gemini/             # Google Gemini
└── ...
```

---

## 🧪 Testes

### E2E (Playwright)
```bash
npm run e2e              # Rodar testes
npm run e2e:ui           # Com UI
npm run e2e:debug        # Debug mode
```

**Testes implementados:**
- Landing page load
- Booking modal flow
- Responsividade mobile
- TypeScript lint
- PWA offline

### Unit Tests (Vitest)
```bash
npm run test             # Rodar testes
npm run test:ui          # Com UI
npm run test:coverage    # Coverage report
```

---

## 🔄 Git Workflow

**Branch principal:** `claude/beauty-project-continuation-4g1tc2`

```bash
# Sincronizar
git fetch origin
git pull origin claude/beauty-project-continuation-4g1tc2

# Fazer mudanças
git add .
git commit -m "feat: descrição da feature"

# Push
git push origin claude/beauty-project-continuation-4g1tc2
```

---

## ⚡ Comandos Rápidos

```bash
# Dev
npm run dev              # localhost:3000

# Build
npm run build            # Production build

# Testes
npm run lint             # TypeScript
npm run test             # Unit tests
npm run e2e              # E2E tests

# Validação
npx tsx scripts/validate-whatsapp.ts
```

---

## 🐛 Problemas Conhecidos

### ✅ Resolvidos
- ✅ React setState race condition (mitigada com isMounted flags)
- ✅ Duplicação de lógica de state (extrair custom hook)
- ✅ Falta de validação de env vars (adicionado validator)

### 🟡 Para Resolver
- [ ] Global error handler
- [ ] Testes unitários para formatters
- [ ] Refactor StorageService para Context

---

## 📞 Contatos Importantes

**Proprietária do Projeto:** Elisangela  
**Profissionais:**
- Elisangela
- Talitha
- Nayara

**WhatsApp Números:**
- (41) 98497-9940 (número principal)

**Google Calendar:** 
- Compartilhado com Elisangela, Talitha, Nayara

---

## 🎯 Como Claude Pode Ajudar

### ✅ Eu posso fazer:
1. **Codificação** - Features, fixes, refactoring
2. **Testes** - Escrever e executar testes
3. **Documentação** - Atualizar docs
4. **Deploy** - Commits e push para Vercel
5. **Debugging** - Encontrar e corrigir bugs
6. **Validação** - Rodar scripts de validação

### ❌ Não posso fazer (preciso de aprovação):
1. Deletar branches
2. Force push
3. Mergear PRs
4. Deletar dados do banco

---

## 📚 Links Úteis

- **Dashboard Admin:** https://seu-app.vercel.app/admin
- **Landing Page:** https://seu-app.vercel.app
- **Supabase:** https://app.supabase.com
- **Vercel:** https://vercel.com
- **Meta Business:** https://business.facebook.com
- **Google Cloud:** https://console.cloud.google.com

---

## 📝 Notas Importantes

1. **Credenciais:** NUNCA commitadas. Sempre em `.env.local`
2. **Secrets:** Service role key APENAS em Vercel
3. **Testes:** Rodar antes de cada commit
4. **Documentação:** Em `docs/` - centralizada!
5. **TypeScript:** Sem `any`. 100% tipado!

---

## 🚀 Kickoff Rápido

Se você é novo no projeto:

1. Leia este arquivo (você está aqui! ✓)
2. Leia `README.md` (visão geral)
3. Consulte `docs/guides/` (como fazer X?)
4. Abra `src/App.tsx` (ponto de entrada)
5. Explore `src/components/` (entender estrutura)

---

**Última atualização:** 31/10/2026  
**Versão:** 1.0.0  
**Mantido por:** Claude Code (AI)

*Este arquivo deve ser atualizado quando a arquitetura mudar.*
