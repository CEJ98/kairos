import { test, expect } from '@playwright/test';

test.describe('E2E demo flow', () => {
  test('demo bootstrap → dashboard → workout → commit → progress → calendar', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByText('Explora la demo')).toBeVisible();
    await page.getByRole('button', { name: 'Probar demo' }).click();

    // After sign-in, land on dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('button', { name: 'Start next workout' })).toBeVisible();

    // Start next workout
    await page.getByRole('button', { name: 'Start next workout' }).click();
    await page.waitForURL(/.*\/workout\/.+/);

    // Fill first set weight and reps
    const pesoInput = page.locator('label:has-text("Peso")').locator('input').first();
    const repsInput = page.locator('label:has-text("Reps")').locator('input').first();
    await pesoInput.fill('50');
    await repsInput.fill('8');

    // Commit session
    await page.getByRole('button', { name: 'Completar sesión' }).click();
    await page.waitForURL('**/progress');
    await expect(page.getByText('Panel de progreso')).toBeVisible();

    // Calendar reschedule
    await page.goto('/calendar');
    await expect(page.getByText('Calendario inteligente')).toBeVisible();
    const rescheduleBtn = page.getByRole('button', { name: 'Reprogramar' }).first();
    await rescheduleBtn.click();

    // Insights placeholder without data is visible for fresh demo
    await page.goto('/insights');
    await expect(page.getByText('Need more sessions')).toBeVisible();
  });
});