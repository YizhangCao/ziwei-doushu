import { test, expect } from '@playwright/test';

// #15: logged-out users are sent from member pages to /login, which offers GitHub login.
test('logged-out visit to /charts redirects to /login', async ({ page }) => {
  await page.goto('/charts');
  await expect(page).toHaveURL(/\/login(\?|$)/);
});

test('login page offers GitHub sign-in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '使用 GitHub 登录' })).toBeVisible();
});
