import { test, expect, type Page } from '@playwright/test';

// User flow 1 (AGENTS.md 2.4), the part without login: fill BirthForm with made-up data,
// build the chart in the browser, and see all 12 palaces on the board.
const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

// BirthForm's selects have no accessible names yet, so find each one by its placeholder option.
const selectWithOption = (page: Page, optionText: string) =>
  page.locator('select').filter({ has: page.locator('option', { hasText: new RegExp(`^${optionText}$`) }) });

test('builds a chart from the birth form and shows 12 palaces', async ({ page }) => {
  await page.goto('/chart');
  await expect(page.getByRole('heading', { level: 1, name: '紫微斗数排盘' })).toBeVisible();
  // No chart yet: the board isn't rendered before the form is submitted.
  await expect(page.getByText('仆役', { exact: true })).toHaveCount(0);

  await selectWithOption(page, '年份').selectOption('1992');
  await selectWithOption(page, '月份').selectOption('3');
  await selectWithOption(page, '日期').selectOption('8');
  await selectWithOption(page, '00 时').selectOption('9');
  await page.getByRole('button', { name: '♂ 男' }).click();
  await page.getByRole('button', { name: /立即起盘/ }).click();

  for (const name of PALACES) {
    await expect(page.getByText(name, { exact: true }).first(), `palace ${name}`).toBeVisible();
  }
});
