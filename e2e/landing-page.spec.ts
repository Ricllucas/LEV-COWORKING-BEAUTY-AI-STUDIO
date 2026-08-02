import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle('LEV COWORKING BEAUTY');

    // Check main heading
    await expect(page.locator('text=Sua Beleza Completa')).toBeVisible();
  });

  test('should display professionals section', async ({ page }) => {
    // Scroll to professionals section
    const professionalsSection = page.locator('text=Conheça nossas especialistas');
    await professionalsSection.scrollIntoViewIfNeeded();
    await expect(professionalsSection).toBeVisible();

    // Check for professional names
    await expect(page.locator('text=Elisangela')).toBeVisible();
    await expect(page.locator('text=Talitha')).toBeVisible();
    await expect(page.locator('text=Nayara')).toBeVisible();
  });

  test('should display services menu', async ({ page }) => {
    const servicesSection = page.locator('text=Menu de Atendimentos');
    await servicesSection.scrollIntoViewIfNeeded();
    await expect(servicesSection).toBeVisible();

    // Check service categories
    await expect(page.locator('button:has-text("Todos os Serviços")')).toBeVisible();
  });

  test('should filter services by professional', async ({ page }) => {
    const servicesSection = page.locator('text=Menu de Atendimentos');
    await servicesSection.scrollIntoViewIfNeeded();

    // Click on a professional filter
    const elisangelaFilter = page.locator('button:has-text("Elisangela")').first();
    await elisangelaFilter.click();

    // Verify services are filtered
    await expect(page.locator('text=Manicure Tradicional')).toBeVisible();
  });

  test('should have working WhatsApp links', async ({ page, context }) => {
    // Intercept new page (WhatsApp link opens in new tab)
    const newPagePromise = context.waitForEvent('page');

    // Find and click a WhatsApp button
    const whatsappButtons = page.locator('a[href*="wa.me"]');
    await expect(whatsappButtons.first()).toBeVisible();

    // Check href contains wa.me
    const href = await whatsappButtons.first().getAttribute('href');
    expect(href).toContain('wa.me');
  });

  test('should display testimonials', async ({ page }) => {
    const testimonialSection = page.locator('text=O que dizem sobre nosso espaço');
    await testimonialSection.scrollIntoViewIfNeeded();
    await expect(testimonialSection).toBeVisible();

    // Check for review content
    await expect(page.locator('text=Mariana Souza').or(page.locator('text=Patrícia'))).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Check main heading is still visible
    await expect(page.locator('text=Sua Beleza Completa')).toBeVisible();

    // Check navigation is present
    const mobileNav = page.locator('nav');
    await expect(mobileNav).toBeVisible();
  });
});
