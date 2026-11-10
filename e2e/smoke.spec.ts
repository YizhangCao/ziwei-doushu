import { test, expect } from '@playwright/test';

// Relative URL on purpose: passes only once playwright.config sets baseURL and starts the app.
test('chart page loads', async ({ page }) => {
  await page.goto('/chart');
  await expect(page.getByRole('heading', { level: 1, name: '紫微斗数排盘' })).toBeVisible();
});
