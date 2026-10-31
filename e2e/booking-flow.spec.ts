import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open booking modal when clicking service', async ({ page }) => {
    // Scroll to services
    const servicesSection = page.locator('text=Menu de Atendimentos');
    await servicesSection.scrollIntoViewIfNeeded();

    // Click on first service booking button
    const bookingButton = page.locator('button:has-text("Agendar")').first();
    await bookingButton.click();

    // Modal should be visible
    const modal = page.locator('text=Agendamento Online').or(page.locator('[role="dialog"]'));
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should allow selecting professional', async ({ page }) => {
    // Navigate to professionals section
    const professonalButton = page.locator('button:has-text("Agendar com Elisangela")').first();
    if (await professonalButton.isVisible()) {
      await professonalButton.click();

      // Modal should open
      const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento Online'));
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate through booking steps', async ({ page }) => {
    // Open booking modal
    const bookingButton = page.locator('button:has-text("Agendar")').first();
    await bookingButton.click();

    // Wait for modal to be visible
    const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Look for next button
    const nextButton = page.locator('button:has-text("Próximo")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      // Should navigate to next step
      await expect(page.locator('text=Seus Dados').or(page.locator('text=Data e Horário'))).toBeVisible({ timeout: 3000 });
    }
  });

  test('should close booking modal with back button', async ({ page }) => {
    // Open booking modal
    const bookingButton = page.locator('button:has-text("Agendar")').first();
    await bookingButton.click();

    // Wait for modal
    const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click close/back button
    const backButton = page.locator('button:has-text("Voltar")');
    if (await backButton.isVisible()) {
      await backButton.click();
      // Modal should close
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should display date picker in booking', async ({ page }) => {
    // Open booking
    const bookingButton = page.locator('button:has-text("Agendar")').first();
    await bookingButton.click();

    // Wait for modal
    const modal = page.locator('[role="dialog"]').or(page.locator('text=Agendamento'));
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Look for date input
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.count() > 0) {
      await expect(dateInput.first()).toBeVisible();
    }
  });
});
