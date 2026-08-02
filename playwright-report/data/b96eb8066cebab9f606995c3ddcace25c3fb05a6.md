# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-flow.spec.ts >> Booking Flow >> should open booking modal when clicking service
- Location: e2e\booking-flow.spec.ts:8:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.scrollIntoViewIfNeeded: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Menu de Atendimentos')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e11]:
    - heading "Configuração Incompleta" [level=1] [ref=e12]
    - paragraph [ref=e13]: A aplicação está faltando variáveis de ambiente obrigatórias.
  - generic [ref=e14]:
    - heading "Variáveis Faltando" [level=2] [ref=e15]
    - generic [ref=e16]:
      - generic [ref=e17]:
        - code [ref=e18]: VITE_SUPABASE_URL
        - button "Copiar" [ref=e19]
      - generic [ref=e23]:
        - code [ref=e24]: VITE_SUPABASE_PUBLISHABLE_KEY
        - button "Copiar" [ref=e25]
  - generic [ref=e29]:
    - heading "Como Configurar" [level=2] [ref=e30]
    - list [ref=e31]:
      - listitem [ref=e32]:
        - generic [ref=e33]: "1."
        - generic [ref=e34]:
          - text: Abra o arquivo
          - code [ref=e35]: .env
          - text: na raiz do projeto
      - listitem [ref=e36]:
        - generic [ref=e37]: "2."
        - generic [ref=e38]: Preencha os valores das variáveis acima com suas chaves Supabase
      - listitem [ref=e39]:
        - generic [ref=e40]: "3."
        - generic [ref=e41]: Reinicie o servidor de desenvolvimento
    - link "Ver documentação do Supabase" [ref=e42] [cursor=pointer]:
      - /url: https://supabase.com/docs/guides/getting-started
  - generic [ref=e47]:
    - paragraph [ref=e48]:
      - text: Para desenvolvimento local, use o arquivo
      - code [ref=e49]: .env.example
      - text: como referência.
    - paragraph [ref=e50]:
      - text: Nunca commite arquivos
      - code [ref=e51]: .env
      - text: com valores reais!
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Booking Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |   });
  7  | 
  8  |   test('should open booking modal when clicking service', async ({ page }) => {
  9  |     // Scroll to services
  10 |     const servicesSection = page.locator('text=Menu de Atendimentos');
> 11 |     await servicesSection.scrollIntoViewIfNeeded();
     |                           ^ Error: locator.scrollIntoViewIfNeeded: Test timeout of 30000ms exceeded.
  12 | 
  13 |     // Click on first service booking button
  14 |     const bookingButton = page.locator('button:has-text("Agendar")').first();
  15 |     await bookingButton.click();
  16 | 
  17 |     // Modal should be visible
  18 |     const modal = page.locator('text=Agendamento Online').or(page.locator('[role="dialog"]'));
  19 |     await expect(modal).toBeVisible({ timeout: 5000 });
  20 |   });
  21 | 
  22 |   test('should allow selecting professional', async ({ page }) => {
  23 |     // Navigate to professionals section
  24 |     const professonalButton = page.locator('button:has-text("Agendar com Elisangela")').first();
  25 |     if (await professonalButton.isVisible()) {
  26 |       await professonalButton.click();
  27 | 
  28 |       // Modal should open
  29 |       const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento Online'));
  30 |       await expect(modal).toBeVisible({ timeout: 5000 });
  31 |     }
  32 |   });
  33 | 
  34 |   test('should navigate through booking steps', async ({ page }) => {
  35 |     // Open booking modal
  36 |     const bookingButton = page.locator('button:has-text("Agendar")').first();
  37 |     await bookingButton.click();
  38 | 
  39 |     // Wait for modal to be visible
  40 |     const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento'));
  41 |     await expect(modal).toBeVisible({ timeout: 5000 });
  42 | 
  43 |     // Look for next button
  44 |     const nextButton = page.locator('button:has-text("Próximo")');
  45 |     if (await nextButton.isEnabled()) {
  46 |       await nextButton.click();
  47 |       // Should navigate to next step
  48 |       await expect(page.locator('text=Seus Dados').or(page.locator('text=Data e Horário'))).toBeVisible({ timeout: 3000 });
  49 |     }
  50 |   });
  51 | 
  52 |   test('should close booking modal with back button', async ({ page }) => {
  53 |     // Open booking modal
  54 |     const bookingButton = page.locator('button:has-text("Agendar")').first();
  55 |     await bookingButton.click();
  56 | 
  57 |     // Wait for modal
  58 |     const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento'));
  59 |     await expect(modal).toBeVisible({ timeout: 5000 });
  60 | 
  61 |     // Click close/back button
  62 |     const backButton = page.locator('button:has-text("Voltar")');
  63 |     if (await backButton.isVisible()) {
  64 |       await backButton.click();
  65 |       // Modal should close
  66 |       await expect(modal).not.toBeVisible({ timeout: 3000 });
  67 |     }
  68 |   });
  69 | 
  70 |   test('should display date picker in booking', async ({ page }) => {
  71 |     // Open booking
  72 |     const bookingButton = page.locator('button:has-text("Agendar")').first();
  73 |     await bookingButton.click();
  74 | 
  75 |     // Wait for modal
  76 |     const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento'));
  77 |     await expect(modal).toBeVisible({ timeout: 5000 });
  78 | 
  79 |     // Look for date input
  80 |     const dateInput = page.locator('input[type="date"]');
  81 |     if (await dateInput.count() > 0) {
  82 |       await expect(dateInput.first()).toBeVisible();
  83 |     }
  84 |   });
  85 | });
  86 | 
```