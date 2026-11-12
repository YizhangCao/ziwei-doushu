import { test, expect } from '@playwright/test';
import { resetE2eMember, signInAsE2eMember } from './helpers/auth';

// #24: create an API key on /settings (shown once), use it, then revoke it.

const CHART_BODY = { date: '1990-06-15', hour: 6, gender: 'female' };

test('a guest is sent to log in', async ({ page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fsettings/);
});

test.describe('signed in', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await resetE2eMember();
    await signInAsE2eMember(context, baseURL!);
  });

  test('create a key (shown once) → use it → revoke it', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'API key' })).toBeVisible();
    await expect(page.getByText('还没有 API key')).toBeVisible();

    await page.getByLabel('Key 名称').fill('E2E 脚本');
    await page.getByRole('button', { name: '创建 API key' }).click();

    // Shown once, with a warning.
    const shown = page.getByTestId('new-api-key');
    await expect(shown).toBeVisible();
    const plainKey = (await shown.textContent())!.trim();
    expect(plainKey).toMatch(/^zwk_[A-Za-z0-9_-]{43}$/);
    await expect(page.getByText('只显示这一次')).toBeVisible();

    // It works on the public API.
    const ok = await page.request.post('/api/v1/charts', { headers: { Authorization: `Bearer ${plainKey}` }, data: CHART_BODY });
    expect(ok.status()).toBe(200);

    // After a reload the key is listed by its prefix only.
    await page.reload();
    await expect(page.getByTestId('new-api-key')).toHaveCount(0);
    await expect(page.getByText(plainKey)).toHaveCount(0);
    const row = page.getByRole('listitem').filter({ hasText: 'E2E 脚本' });
    await expect(row).toContainText(plainKey.slice(0, 12));

    // Revoke, with confirmation.
    await row.getByRole('button', { name: '撤销' }).click();
    await row.getByRole('button', { name: '确认撤销' }).click();
    await expect(row).toContainText('已撤销');

    const denied = await page.request.post('/api/v1/charts', { headers: { Authorization: `Bearer ${plainKey}` }, data: CHART_BODY });
    expect(denied.status()).toBe(401);
  });
});
