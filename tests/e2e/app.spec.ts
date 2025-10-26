import { test, expect } from '@playwright/test';

test.describe('Flujo principal', () => {
  test('visita landing y muestra CTA demo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Probar demo' })).toBeVisible();
  });

  test('navega a registro', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Únete a Kairos' })).toBeVisible();
  });
});
