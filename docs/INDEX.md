# 📚 Índice Centralizado de Documentação

**Guia rápido para encontrar o que você precisa.**

---

## 🚀 COMEÇAR AQUI

Novo no projeto?

1. **Ler em 5 min:** `/README.md` - Overview do projeto
2. **Entender contexto:** `/CLAUDE.md` - Contexto técnico
3. **Primeiros passos:** `guides/SETUP_INICIAL.md` - Como rodar local

---

## 📖 Guias de Setup (`guides/`)

**Para configurar cada integração:**

| Guia | Duração | Para quem |
|------|---------|----------|
| **SETUP_INICIAL.md** | 10 min | Todos - primeiros passos |
| **SETUP_CREDENCIAIS_META.md** | 5 min | Dev - pegar credenciais |
| **WHATSAPP_CREDENCIAIS_GUIA.md** | 10 min | Passo a passo visual |
| **WHATSAPP_QUICKSTART.md** | 5 min | Quick reference |
| **SETUP_VERCEL.md** | 15 min | Deploy - adicionar env vars |
| **WHATSAPP_AUTOMACAO_COMPLETA.md** | 20 min | Entender toda automação |
| **GOOGLE_CALENDAR_SETUP.md** | 15 min | Integrar Google Agenda |
| **GOOGLE_CALENDAR_DETALHADO.md** | 20 min | Implementação completa |
| **DEPLOYMENT_GUIDE.md** | 20 min | Deploy em produção |
| **REMINDERS_SETUP.md** | 15 min | Configurar lembretes |

---

## 📋 Referência Técnica (`reference/`)

**Documentação técnica detalhada:**

| Documento | Conteúdo |
|-----------|----------|
| **VARIÁVEIS_AMBIENTE.md** | Todas as env vars explicadas |
| **API_ENDPOINTS.md** | Endpoints disponíveis |
| **DATABASE_SCHEMA.md** | Schema do Supabase |
| **GOOGLE_CALENDAR_MELHORIAS.md** | Ideias de melhoria |
| **TESTES_E2E_GUIA.md** | Como rodar testes Playwright |
| **VERIFICACAO_WHATSAPP_BUSINESS.md** | Validar configuração |

---

## 📊 Relatórios (`reports/`)

**Análises e status do projeto:**

| Relatório | Data | Assunto |
|-----------|------|---------|
| **CODE_REVIEW.md** | 01/08/2026 | Review completo do código |
| **PROGRESS.md** | Atual | Status atual do projeto |

---

## ✅ Checklists (`checklists/`)

**Para verificar antes de ações importantes:**

| Checklist | Quando usar |
|-----------|------------|
| **DEPLOYMENT_CHECKLIST.md** | Antes de colocar em produção |

---

## 🧪 Testes (`test-reports/`)

**Resultados de testes automatizados:**

```
test-reports/
├── playwright-report/     # Resultados E2E
└── test-results/          # Resultados unit tests
```

---

## 🎯 Busca Rápida por Tópico

### "Como faço para..."

**...configurar WhatsApp?**
1. `guides/SETUP_CREDENCIAIS_META.md` - Pegar credenciais
2. `guides/SETUP_VERCEL.md` - Adicionar em Vercel
3. `guides/WHATSAPP_AUTOMACAO_COMPLETA.md` - Entender fluxo
4. `reference/VERIFICACAO_WHATSAPP_BUSINESS.md` - Validar

**...integrar Google Agenda?**
1. `guides/GOOGLE_CALENDAR_SETUP.md` - Setup rápido
2. `guides/GOOGLE_CALENDAR_DETALHADO.md` - Implementação
3. `reference/VARIÁVEIS_AMBIENTE.md` - Env vars

**...fazer deploy?**
1. `guides/DEPLOYMENT_GUIDE.md` - Guia passo a passo
2. `checklists/DEPLOYMENT_CHECKLIST.md` - Verificar tudo
3. `reference/VARIÁVEIS_AMBIENTE.md` - Confirmar env vars

**...rodar testes?**
1. `reference/TESTES_E2E_GUIA.md` - E2E tests
2. `/README.md` - Comandos rápidos
3. `test-reports/` - Ver resultados

**...entender a arquitetura?**
1. `/CLAUDE.md` - Contexto técnico
2. `/README.md` - Estrutura de pastas
3. `reference/DATABASE_SCHEMA.md` - Banco de dados

### "Qual é o status de..."

1. Consulte `reports/CODE_REVIEW.md` - Review técnico completo
2. Consulte `reports/PROGRESS.md` - Status atual
3. Consulte `/README.md` - Tabela de features

---

## 📖 Para Diferentes Roles

### 👨‍💻 Desenvolvedor
1. `/CLAUDE.md` - Contexto
2. `/README.md` - Visão geral
3. `reference/` - Documentação técnica
4. `guides/SETUP_INICIAL.md` - Começar

### 🚀 DevOps / Deploy
1. `guides/DEPLOYMENT_GUIDE.md` - Como fazer deploy
2. `checklists/DEPLOYMENT_CHECKLIST.md` - Verificar tudo
3. `reference/VARIÁVEIS_AMBIENTE.md` - Env vars

### 👨‍💼 Gerente de Projeto
1. `/README.md` - Overview
2. `reports/PROGRESS.md` - Status
3. `reports/CODE_REVIEW.md` - Qualidade do código

### 🤖 Claude (AI Assistant)
1. `/CLAUDE.md` - Contexto completo
2. `README.md` - Visão geral
3. Consultar documentação específica conforme necessário

---

## 🔗 Estrutura de Links

Todos os documentos usam links relativos:
- `docs/guides/SETUP_INICIAL.md` → Lê `guides/SETUP_INICIAL.md`
- `docs/reference/` → Arquivos em `reference/`
- `/README.md` → Arquivo na raiz

**Dica:** Use `Ctrl+Click` para abrir links em nova aba.

---

## 📝 Como Adicionar Documentação

1. **Criar novo arquivo** em `docs/`
2. **Colocar na subpasta** correta:
   - Setup → `guides/`
   - Técnico → `reference/`
   - Análise → `reports/`
   - Processo → `checklists/`
3. **Atualizar este INDEX** com novo documento
4. **Fazer commit** com mensagem clara

---

## 🔄 Manutenção

- **Atualizado em:** 31/10/2026
- **Próxima review:** Quando houver mudanças arquitetura
- **Mantido por:** Equipe de desenvolvimento

---

## 💡 Dicas Úteis

### Para buscar algo rápido:
```bash
# Buscar em todos os docs
grep -r "palavra-chave" docs/

# Buscar em um tipo específico
grep -r "setup" docs/guides/
```

### Para navegar:
- Use `Ctrl+F` para buscar dentro de um arquivo
- Use links de índice para ir direto ao assunto
- Volte para este INDEX para rorigetar

### Para aprender mais:
- Leia `reports/CODE_REVIEW.md` para entender qualidade
- Consulte `reference/` para detalhas técnicos
- Explore `guides/` para como fazer as coisas

---

**Precisando de algo que não está documentado? Crie um issue ou fale com Claude!**

*Última atualização: 31/10/2026*
