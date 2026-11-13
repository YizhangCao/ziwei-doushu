import { test, expect, type Page } from '@playwright/test';
import { resetE2eMember, signInAsE2eMember } from './helpers/auth';

// #18 main flow: save a chart from /chart, then list, open, rename and delete it on /charts.
// Made-up birth data only.

// The birth form as redesigned in #57: year, month and day selects, the clock-hour select
// (#bf-hour), gender buttons and one 起盘 button.
async function buildChart(page: Page) {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1992');
  await selects.nth(1).selectOption('3');
  await selects.nth(2).selectOption('8');
  await page.locator('#bf-hour').selectOption('9');
  await page.getByRole('button', { name: '男', exact: true }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByText('仆役', { exact: true }).first()).toBeVisible();
}

test('a guest builds a chart but is asked to log in to save it', async ({ page }) => {
  await buildChart(page);
  await expect(page.getByRole('button', { name: '保存命盘' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '登录后保存命盘' })).toBeVisible();
});

test.describe('signed in', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await resetE2eMember();
    await signInAsE2eMember(context, baseURL!);
  });

  test('save → list → open → rename → delete', async ({ page }) => {
    // Save from /chart.
    await buildChart(page);
    await page.getByLabel('命盘名称').fill('E2E 测试盘');
    await page.getByRole('button', { name: '保存命盘' }).click();
    await expect(page.getByRole('status')).toContainText('已保存');

    // It is listed on /charts.
    await page.goto('/charts');
    const row = page.getByRole('listitem').filter({ hasText: 'E2E 测试盘' });
    await expect(row).toBeVisible();

    // Opening it rebuilds the chart on /chart.
    await row.getByRole('link', { name: 'E2E 测试盘' }).click();
    await expect(page).toHaveURL(/\/chart\?id=/);
    await expect(page.getByText('仆役', { exact: true }).first()).toBeVisible();

    // Rename.
    await page.goto('/charts');
    await page.getByRole('listitem').filter({ hasText: 'E2E 测试盘' }).getByRole('button', { name: '重命名' }).click();
    await page.getByLabel('新名称').fill('E2E 改名后');
    await page.getByRole('button', { name: '保存名称' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'E2E 改名后' })).toBeVisible();

    // Delete, with confirmation.
    const renamed = page.getByRole('listitem').filter({ hasText: 'E2E 改名后' });
    await renamed.getByRole('button', { name: '删除' }).click();
    await expect(renamed.getByText('确定删除这个命盘？')).toBeVisible();
    await renamed.getByRole('button', { name: '确认删除' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'E2E 改名后' })).toHaveCount(0);
    await expect(page.getByText('还没有保存的命盘')).toBeVisible();
  });

  test('cancelling the delete keeps the chart', async ({ page }) => {
    // page.request shares the signed-in cookies.
    const res = await page.request.post('/api/charts', {
      data: { name: 'E2E 保留', birthInfo: { year: 1992, month: 3, day: 8, hour: 4, gender: 'male' } },
    });
    expect(res.status()).toBe(201);

    await page.goto('/charts');
    const row = page.getByRole('listitem').filter({ hasText: 'E2E 保留' });
    await row.getByRole('button', { name: '删除' }).click();
    await row.getByRole('button', { name: '取消' }).click();
    await expect(row).toBeVisible();
  });

  test('a double click on confirm delete deletes once, without an error', async ({ page }) => {
    const res = await page.request.post('/api/charts', {
      data: { name: 'E2E 双击', birthInfo: { year: 1992, month: 3, day: 8, hour: 4, gender: 'male' } },
    });
    expect(res.status()).toBe(201);

    await page.goto('/charts');
    const row = page.getByRole('listitem').filter({ hasText: 'E2E 双击' });
    await row.getByRole('button', { name: '删除' }).click();
    await row.getByRole('button', { name: '确认删除' }).dblclick();
    await expect(page.getByRole('status').first()).toHaveText('已删除。');
    await expect(page.getByText('删除失败，请稍后重试。')).toHaveCount(0);
    await expect(page.getByRole('listitem').filter({ hasText: 'E2E 双击' })).toHaveCount(0);
  });
});
