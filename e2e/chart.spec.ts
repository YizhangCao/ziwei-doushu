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

// Every field is found by its label (#46). Exact matches: the day select is named 出生日期,
// which is also the start of the date group's label 出生日期（公历） on the year select.
async function buildChart(page: Page) {
  await page.goto('/chart');
  await page.getByLabel('出生日期（公历）', { exact: true }).selectOption('1990');
  await page.getByLabel('出生月份', { exact: true }).selectOption('6');
  await page.getByLabel('出生日期', { exact: true }).selectOption('15');
  await page.getByLabel('出生时间（北京时间）', { exact: true }).selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByRole('region', { name: '命盘' })).toBeVisible();
}

test('every input and select in the birth form has an id and an associated label (#46)', async ({ page }) => {
  await page.goto('/chart');
  const unlabelled = await page.locator('form input, form select').evaluateAll((controls) =>
    controls
      .filter((el) => {
        const labelled = el.id !== '' && document.querySelector(`label[for="${CSS.escape(el.id)}"]`) !== null;
        // Inside a labelled group (date, place, time) a select may carry its own aria-label instead.
        return el.id === '' || (!labelled && !el.getAttribute('aria-label'));
      })
      .map((el) => el.outerHTML.slice(0, 80)),
  );
  expect(unlabelled).toEqual([]);

  // And each one is reachable by its label.
  for (const name of ['姓名（可选）', '出生日期（公历）', '出生月份', '出生日期', '出生城市', '出生时间（北京时间）', '出生分钟']) {
    await expect(page.getByLabel(name, { exact: true }), name).toHaveCount(1);
  }
  await expect(page.getByLabel('出生地点（可选，用于真太阳时校正）', { exact: true })).toHaveCount(1);
});

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
