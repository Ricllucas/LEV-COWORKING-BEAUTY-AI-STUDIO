import { test, expect, type Page } from '@playwright/test';

// A página pública abre já com a janela de agendamento por cima (de propósito).
// Para olhar a página por trás, fechamos a janela primeiro.
async function closeBookingWindow(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Agendamento online' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Fechar' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle('LEV COWORKING BEAUTY');
    await closeBookingWindow(page);
    await expect(page.getByRole('heading', { level: 2, name: /Sua Beleza Completa/ })).toBeVisible();
  });

  test('should display professionals section', async ({ page }) => {
    await closeBookingWindow(page);
    const section = page.getByRole('heading', { name: 'Conheça nossas especialistas' });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();

    for (const name of ['Elisangela', 'Talitha', 'Nayara']) {
      await expect(page.getByRole('heading', { level: 3, name, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: `Agendar com ${name}` })).toBeVisible();
    }
  });

  test('should display services menu', async ({ page }) => {
    await closeBookingWindow(page);
    const section = page.getByRole('heading', { name: 'Menu de Atendimentos' });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(page.getByRole('button', { name: 'Todos os Serviços' })).toBeVisible();
  });

  test('should filter services by professional', async ({ page }) => {
    await closeBookingWindow(page);
    await page.getByRole('heading', { name: 'Menu de Atendimentos' }).scrollIntoViewIfNeeded();

    // Antes do filtro aparecem serviços de todas as profissionais.
    await expect(page.getByRole('heading', { level: 3, name: 'Extensão de Cílios' })).toBeVisible();

    await page.getByRole('button', { name: /^Elisangela \(/ }).click();

    await expect(page.getByRole('heading', { level: 3, name: 'Mão Tradicional' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Extensão de Cílios' })).toHaveCount(0);
  });

  test('should have working WhatsApp links', async ({ page }) => {
    await closeBookingWindow(page);
    const whatsappLinks = page.getByRole('link', { name: 'WhatsApp Direto' });
    await expect(whatsappLinks).toHaveCount(3);
    for (const href of await whatsappLinks.evaluateAll(links => links.map(a => a.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\/wa\.me\/55\d{10,11}\?text=/);
    }
  });

  test('should display testimonials', async ({ page }) => {
    await closeBookingWindow(page);
    const section = page.getByRole('heading', { name: 'O que dizem sobre nosso espaço' });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver todas as avaliações no Google' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await closeBookingWindow(page);
    await expect(page.getByRole('heading', { level: 2, name: /Sua Beleza Completa/ })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();

    // Nada da página pode passar da largura da tela do celular.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
