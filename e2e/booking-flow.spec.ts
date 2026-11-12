import { test, expect, type Page } from '@playwright/test';

// Estes testes andam pela janela de agendamento, mas nunca chegam a enviar
// um agendamento: param antes do passo "Seus Dados".

const bookingWindow = (page: Page) => page.getByRole('dialog', { name: 'Agendamento online' });

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open booking window when the site opens', async ({ page }) => {
    const dialog = bookingWindow(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '1. Escolha a Profissional' })).toBeVisible();
  });

  test('should open booking window when clicking a service', async ({ page }) => {
    await bookingWindow(page).getByRole('button', { name: 'Fechar' }).click();
    await expect(bookingWindow(page)).toBeHidden();

    await page.getByRole('heading', { name: 'Menu de Atendimentos' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Agendar', exact: true }).first().click();

    await expect(bookingWindow(page)).toBeVisible();
    // Com o serviço escolhido, a janela já pula a escolha da profissional.
    await expect(bookingWindow(page).getByRole('heading', { name: '1. Escolha a Profissional' })).toBeHidden();
  });

  test('should open booking window for a chosen professional', async ({ page }) => {
    await bookingWindow(page).getByRole('button', { name: 'Fechar' }).click();
    await page.getByRole('button', { name: 'Agendar com Talitha' }).click();

    // A janela abre com a Talitha já marcada: o botão de seguir aparece direto.
    const dialog = bookingWindow(page);
    await dialog.getByRole('button', { name: 'Próximo: Escolher Serviço' }).click();
    await expect(dialog.getByRole('heading', { name: /2\. Escolha os Serviços \(Talitha\)/ })).toBeVisible();
  });

  test('should navigate through booking steps up to date and time', async ({ page }) => {
    const dialog = bookingWindow(page);

    await dialog.getByRole('button', { name: /Elisangela/ }).click();
    await dialog.getByRole('button', { name: 'Próximo: Escolher Serviço' }).click();
    await expect(dialog.getByRole('heading', { name: /2\. Escolha os Serviços \(Elisangela\)/ })).toBeVisible();

    await dialog.getByRole('button', { name: /^Selecionar / }).first().click();
    await dialog.getByRole('button', { name: 'Próximo: Data e Horário' }).click();

    await expect(dialog.getByRole('heading', { name: '3. Escolha a Data e Horário' })).toBeVisible();
    await expect(dialog.locator('input[type="date"]')).toBeVisible();
  });

  test('should go back a step with the back button', async ({ page }) => {
    const dialog = bookingWindow(page);

    await dialog.getByRole('button', { name: /Nayara/ }).click();
    await dialog.getByRole('button', { name: 'Próximo: Escolher Serviço' }).click();
    await expect(dialog.getByRole('heading', { name: /2\. Escolha os Serviços/ })).toBeVisible();

    await dialog.getByRole('button', { name: 'Voltar' }).click();
    await expect(dialog.getByRole('heading', { name: '1. Escolha a Profissional' })).toBeVisible();
  });

  test('should close booking window with the close button', async ({ page }) => {
    await bookingWindow(page).getByRole('button', { name: 'Fechar' }).click();
    await expect(bookingWindow(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Escolher profissional e agendar' }).first()).toBeVisible();
  });
});
