/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The notes under a reading (#11): every finished reading says it is for reference
 * only, and a reading of the parents, siblings or children palace also says Ziwei Doushu is weaker
 * at family ties. The AI route is mocked; uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';

const REFERENCE = '以上依命盘结构解读，仅供参考。';
const FAMILY = '紫微斗数看父母、兄弟、子女这些六亲，本来就比较弱。这部分只作参考。';

const stream = (text: string) => `data: ${JSON.stringify({ delta: { text } })}\n\ndata: [DONE]\n\n`;

async function buildChart(page: Page) {
  let replies = 0;
  await page.route('**/api/interpret', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: stream(`第 ${++replies} 篇解读。`) }),
  );
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByText('第 1 篇解读。')).toBeVisible();
}

test('every finished reading says it is for reference only', async ({ page }) => {
  await buildChart(page);
  await expect(page.getByText(REFERENCE)).toHaveCount(1);
  await expect(page.getByText(FAMILY)).toHaveCount(0);
});

for (const palace of ['父母', '兄弟', '子女']) {
  test(`a reading of the ${palace} palace also says family readings are weaker`, async ({ page }) => {
    await buildChart(page);
    await page.locator(`[data-palace="${palace}"]`).first().click();
    await expect(page.getByText('第 2 篇解读。')).toBeVisible();
    await expect(page.getByText(REFERENCE)).toHaveCount(2);
    await expect(page.getByText(FAMILY)).toHaveCount(1);
  });
}

test('a reading of another palace has no family note', async ({ page }) => {
  await buildChart(page);
  await page.locator('[data-palace="财帛"]').first().click();
  await expect(page.getByText('第 2 篇解读。')).toBeVisible();
  await expect(page.getByText(REFERENCE)).toHaveCount(2);
  await expect(page.getByText(FAMILY)).toHaveCount(0);
});

test('a failed reading gets no note: it is not a reading', async ({ page }) => {
  await page.route('**/api/interpret', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"failed"}' }),
  );
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByText('解读没有完成，请稍后重试。')).toBeVisible();
  await expect(page.getByText(REFERENCE)).toHaveCount(0);
});
