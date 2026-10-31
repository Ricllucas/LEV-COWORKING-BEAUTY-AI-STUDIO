# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing-page.spec.ts >> Landing Page >> should be responsive on mobile
- Location: e2e\landing-page.spec.ts:71:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Sua Beleza Completa')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Sua Beleza Completa')

```

```yaml
- heading "Configuração Incompleta" [level=1]
- paragraph: A aplicação está faltando variáveis de ambiente obrigatórias.
- heading "Variáveis Faltando" [level=2]
- code: VITE_SUPABASE_URL
- button "Copiar"
- code: VITE_SUPABASE_PUBLISHABLE_KEY
- button "Copiar"
- heading "Como Configurar" [level=2]
- list:
  - listitem:
    - text: 1. Abra o arquivo
    - code: .env
    - text: na raiz do projeto
  - listitem: 2. Preencha os valores das variáveis acima com suas chaves Supabase
  - listitem: 3. Reinicie o servidor de desenvolvimento
- link "Ver documentação do Supabase":
  - /url: https://supabase.com/docs/guides/getting-started
- paragraph:
  - text: Para desenvolvimento local, use o arquivo
  - code: .env.example
  - text: como referência.
- paragraph:
  - text: Nunca commite arquivos
  - code: .env
  - text: com valores reais!
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing Page', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |   });
  7  | 
  8  |   test('should load landing page successfully', async ({ page }) => {
  9  |     // Check title
  10 |     await expect(page).toHaveTitle('LEV COWORKING BEAUTY');
  11 | 
  12 |     // Check main heading
  13 |     await expect(page.locator('text=Sua Beleza Completa')).toBeVisible();
  14 |   });
  15 | 
  16 |   test('should display professionals section', async ({ page }) => {
  17 |     // Scroll to professionals section
  18 |     const professionalsSection = page.locator('text=Conheça nossas especialistas');
  19 |     await professionalsSection.scrollIntoViewIfNeeded();
  20 |     await expect(professionalsSection).toBeVisible();
  21 | 
  22 |     // Check for professional names
  23 |     await expect(page.locator('text=Elisangela')).toBeVisible();
  24 |     await expect(page.locator('text=Talitha')).toBeVisible();
  25 |     await expect(page.locator('text=Nayara')).toBeVisible();
  26 |   });
  27 | 
  28 |   test('should display services menu', async ({ page }) => {
  29 |     const servicesSection = page.locator('text=Menu de Atendimentos');
  30 |     await servicesSection.scrollIntoViewIfNeeded();
  31 |     await expect(servicesSection).toBeVisible();
  32 | 
  33 |     // Check service categories
  34 |     await expect(page.locator('button:has-text("Todos os Serviços")')).toBeVisible();
  35 |   });
  36 | 
  37 |   test('should filter services by professional', async ({ page }) => {
  38 |     const servicesSection = page.locator('text=Menu de Atendimentos');
  39 |     await servicesSection.scrollIntoViewIfNeeded();
  40 | 
  41 |     // Click on a professional filter
  42 |     const elisangelaFilter = page.locator('button:has-text("Elisangela")').first();
  43 |     await elisangelaFilter.click();
  44 | 
  45 |     // Verify services are filtered
  46 |     await expect(page.locator('text=Manicure Tradicional')).toBeVisible();
  47 |   });
  48 | 
  49 |   test('should have working WhatsApp links', async ({ page, context }) => {
  50 |     // Intercept new page (WhatsApp link opens in new tab)
  51 |     const newPagePromise = context.waitForEvent('page');
  52 | 
  53 |     // Find and click a WhatsApp button
  54 |     const whatsappButtons = page.locator('a[href*="wa.me"]');
  55 |     await expect(whatsappButtons.first()).toBeVisible();
  56 | 
  57 |     // Check href contains wa.me
  58 |     const href = await whatsappButtons.first().getAttribute('href');
  59 |     expect(href).toContain('wa.me');
  60 |   });
  61 | 
  62 |   test('should display testimonials', async ({ page }) => {
  63 |     const testimonialSection = page.locator('text=O que dizem sobre nosso espaço');
  64 |     await testimonialSection.scrollIntoViewIfNeeded();
  65 |     await expect(testimonialSection).toBeVisible();
  66 | 
  67 |     // Check for review content
  68 |     await expect(page.locator('text=Mariana Souza').or(page.locator('text=Patrícia'))).toBeVisible();
  69 |   });
  70 | 
  71 |   test('should be responsive on mobile', async ({ page }) => {
  72 |     await page.setViewportSize({ width: 375, height: 812 });
  73 | 
  74 |     // Check main heading is still visible
> 75 |     await expect(page.locator('text=Sua Beleza Completa')).toBeVisible();
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  76 | 
  77 |     // Check navigation is present
  78 |     const mobileNav = page.locator('nav');
  79 |     await expect(mobileNav).toBeVisible();
  80 |   });
  81 | });
  82 | 
```