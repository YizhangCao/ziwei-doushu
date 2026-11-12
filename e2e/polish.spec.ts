/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The polish pass in the browser (#98): the legal pages read like the other
 * reading pages, home headings line up with the nav, and a selected current-decade palace
 * keeps its whole selection outline. Uses a made-up birthday; the AI route is mocked.
 */

import { test, expect, type Page } from '@playwright/test';

/** Left edge of the nav's content, where every page's content should start. */
const navLeft = (page: Page) => page.evaluate(() => {
  const nav = document.querySelector('nav .page')!;
  return nav.getBoundingClientRect().left + parseFloat(getComputedStyle(nav).paddingLeft);
});

test.describe('on a wide screen', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of ['/terms', '/privacy']) {
    test(`${path} has one nav and the reading layout`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('header')).toHaveCount(0); // no second sticky header under the site nav
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCSS('font-size', '30px');
      const box = (await page.locator('main article').boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(720);
      expect(Math.abs(box.x - await navLeft(page))).toBeLessThan(1);
    });
  }

  test('left-aligned home headings line up with the nav', async ({ page }) => {
    await page.goto('/');
    const left = await navLeft(page);
    // Not `main h2`: the <main> landmark comes with #82, a sibling branch
    const lefts = await page.evaluate(() => [...document.querySelectorAll('h2')]
      .filter((h) => getComputedStyle(h).textAlign === 'start' && h.getBoundingClientRect().left < innerWidth / 2)
      .map((h) => h.getBoundingClientRect().left));
    expect(lefts.length).toBeGreaterThan(1);
    for (const x of lefts) expect(Math.abs(x - left)).toBeLessThan(1);
  });
});

test('a selected current-decade palace keeps its whole selection outline', async ({ page }) => {
  await page.route('**/api/interpret', () => { /* never answers */ });
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  const decade = page.locator('[data-palace]:has([data-decade-edge])');
  await decade.click();
  await expect(decade).toHaveAttribute('aria-pressed', 'true');
  const inset = await decade.evaluate((cell) => {
    const edge = cell.querySelector('[data-decade-edge]')!.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    return { left: edge.left - box.left, top: edge.top - box.top };
  });
  expect(inset).toEqual({ left: 1, top: 1 });
});
