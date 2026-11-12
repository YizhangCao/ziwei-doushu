/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The first chart (#57): one site nav, one time navigation, a
 * sentence that anchors the reader on their life palace, and a board that stays
 * full width on a phone. Uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';

async function buildChart(page: Page) {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByRole('region', { name: '命盘' })).toBeVisible();
}

test('the chart page has the site nav and exactly one time navigation', async ({ page }) => {
  await buildChart(page);

  await expect(page.getByRole('navigation').getByRole('link', { name: '紫微命盘' })).toBeVisible();
  await expect(page.getByRole('button', { name: '本命' })).toHaveCount(1);
  await expect(page.getByText(/^你的命宫在/)).toBeVisible();
});

test('on a phone the chart stays full width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await buildChart(page);

  const board = await page.getByRole('region', { name: '命盘' }).boundingBox();
  expect(board?.width ?? 0).toBeGreaterThan(330);
});
