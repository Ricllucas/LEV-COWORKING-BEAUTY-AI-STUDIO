# 🧪 Guia de Testes E2E - LEV Coworking Beauty

## O que é Teste E2E?

E2E (End-to-End) testa a aplicação do ponto de vista do usuário, simulando cliques, preenchimentos de formulário e navegação.

**Ferramentas**: Playwright  
**Testes**: 12 cenários de teste  
**Cobertura**: Landing page + Fluxo de agendamento

---

## ✅ Testes Disponíveis

### Landing Page (7 testes)
```
✓ Carrega página e verifica título
✓ Exibe seção de profissionais
✓ Mostra menu de atendimentos
✓ Filtra serviços por profissional
✓ Links WhatsApp funcionam
✓ Exibe depoimentos
✓ É responsivo no mobile
```

### Fluxo de Agendamento (5 testes)
```
✓ Abre modal ao clicar agendamento
✓ Permite selecionar profissional
✓ Navega entre passos
✓ Fecha modal com botão voltar
✓ Mostra date picker
```

---

## 🚀 Como Executar os Testes

### Opção 1: Modo Interativo (Melhor para aprender)
```bash
npm run e2e:ui
```
- Abre interface visual
- Vê cada teste rodando em tempo real
- Pode pausar e inspecionar

### Opção 2: Modo Headless (Mais rápido)
```bash
npm run e2e
```
- Testes rodando em background
- Resultado final: ✅ ou ❌

### Opção 3: Modo Debug (Para troubleshooting)
```bash
npm run e2e:debug
```
- Abre debugger do Playwright
- Inspecione elementos
- Execute comandos manualmente

---

## 📋 Estrutura dos Testes

```
e2e/
├── landing-page.spec.ts      # 7 testes da página inicial
└── booking-flow.spec.ts       # 5 testes do agendamento
```

### Landing Page Tests:
```typescript
✓ load landing page successfully
✓ display professionals section
✓ display services menu
✓ filter services by professional
✓ have working WhatsApp links
✓ display testimonials
✓ be responsive on mobile
```

### Booking Flow Tests:
```typescript
✓ open booking modal when clicking service
✓ allow selecting professional
✓ navigate through booking steps
✓ close booking modal with back button
✓ display date picker in booking
```

---

## 🔧 Configuração (Já Feita!)

O Playwright está configurado em `playwright.config.ts`:

```typescript
// Browsers testados
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

// Servidor automático
- Roda: npm run dev
- Porta: localhost:3000
- Espera: até 30s para conectar

// Retries
- CI: 2 tentativas
- Local: sem retry
```

---

## 📊 Resultado Esperado

### ✅ Sucesso
```
✓ Landing Page (7)
  ✓ should load landing page successfully (1s)
  ✓ should display professionals section (800ms)
  ✓ should display services menu (650ms)
  ✓ should filter services by professional (920ms)
  ✓ should have working WhatsApp links (600ms)
  ✓ should display testimonials (750ms)
  ✓ should be responsive on mobile (1.2s)

✓ Booking Flow (5)
  ✓ should open booking modal (950ms)
  ✓ should allow selecting professional (800ms)
  ✓ should navigate through steps (1.1s)
  ✓ should close booking modal (650ms)
  ✓ should display date picker (700ms)

12 passed (8.2s)
```

### ❌ Falha (Exemplo)
```
✗ Landing Page
  ✗ should load landing page successfully
    Error: Timeout waiting for locator('text=Sua Beleza Completa')
    
    Expected: visible in 30000ms
    Actual: not found
```

---

## 🐛 Troubleshooting

### "Testes não encontram elementos"

1. **Verifique se app está rodando**
   ```bash
   npm run dev
   # Aguarde "ready on ..." aparecer
   ```

2. **Inspect do elemento**
   ```bash
   npm run e2e:debug
   # Abra DevTools
   # Clique "Pick an element" 
   # Clique no elemento que testa
   ```

3. **Atualize seletor no teste**
   ```typescript
   // Antes (pode estar incorreto)
   page.locator('text=Sua Beleza')
   
   // Depois (inspect pelo DevTools)
   page.locator('h1:has-text("Sua Beleza Completa")')
   ```

### "Timeout esperando página carregar"

1. Aumentar timeout:
   ```typescript
   await expect(page.locator('text=...')).toBeVisible({ timeout: 60000 });
   ```

2. Verificar se URL está correta:
   ```bash
   npm run e2e:debug
   # Console mostra URL final
   ```

### "Teste falha no CI mas passa localmente"

1. Pode ser timing issue
   ```typescript
   // Adicione wait explícito
   await page.waitForTimeout(500);
   ```

2. Ou use `waitForNavigation`:
   ```typescript
   await Promise.all([
     page.waitForNavigation(),
     page.locator('button').click()
   ]);
   ```

---

## 📈 Próximos Testes a Adicionar

```markdown
Agendamento (Frontend)
- [ ] Preencher formulário completo
- [ ] Validação de campos
- [ ] Mensagem de sucesso
- [ ] Checkout com Stripe

Painel Admin
- [ ] Login como profissional
- [ ] Visualizar agenda
- [ ] Modificar agendamento
- [ ] Gerar relatório

Google Agenda
- [ ] Sincronização automática
- [ ] Cores por profissional
- [ ] Bloqueios de tempo

WhatsApp
- [ ] Webhook recebe mensagem
- [ ] Resposta automática
- [ ] Confirmação de agendamento
```

---

## 🚀 Integração com CI/CD

Quando fizer push para `origin/main`:

```bash
1. GitHub Actions dispara
2. Executa: npm run e2e
3. Se passar: ✅ Permite merge
4. Se falhar: ❌ Bloqueia merge
```

Configure em `.github/workflows/test.yml` (se quiser):

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run e2e
```

---

## 💡 Dicas Úteis

### 1. Inspecionar Elementos em Teste
```bash
npm run e2e:debug

# No terminal do Playwright
await page.pause()  # Pausa execução
# Inspecione manualmente no navegador
```

### 2. Gerar Screenshots
```typescript
// Em qualquer teste
await page.screenshot({ path: 'screenshot.png' });
```

### 3. Registrar Vídeo
```typescript
// Já configurado no playwright.config.ts
// Aparece em test-results/ se teste falhar
```

### 4. Testar em Diferentes Tamanhos
```typescript
// Mobile
await page.setViewportSize({ width: 375, height: 812 });

// Tablet
await page.setViewportSize({ width: 768, height: 1024 });

// Desktop
await page.setViewportSize({ width: 1280, height: 800 });
```

---

## 📊 Cobertura Esperada

```
Landing Page
├── ✅ Renderização
├── ✅ Navegação
├── ✅ Filtros
└── ✅ Links

Agendamento
├── ✅ Modal
├── ✅ Seleção profissional
├── ✅ Passos
└── ✅ Validação

Responsividade
├── ✅ Desktop
├── ✅ Tablet
└── ✅ Mobile

Performance
├── ✅ Carregamento
├── ✅ Interatividade
└── ✅ Transições
```

---

## ✅ Checklist Pré-Produção

- [ ] Todos os 12 testes passando
- [ ] Sem erros de timeout
- [ ] Performance em < 5s
- [ ] Mobile responsivo
- [ ] WhatsApp links corretos
- [ ] Data picker funcional
- [ ] Modal abre/fecha
- [ ] Nenhum console error

---

## 📞 Executar Agora

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Executar testes (não fecha servidor)
npm run e2e

# Ou com UI:
npm run e2e:ui
```

**Tempo esperado**: 8-12 segundos  
**Resultado esperado**: 12 passed ✅

---

**Documentação**: 2026-08-01  
**Versão**: 1.0  
**Próxima atualização**: Quando adicionar novos testes
