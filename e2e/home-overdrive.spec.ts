/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Home overdrive (#84): the first screen's sky turns around the pole star,
 * and a chart walkthrough follows. The walkthrough's chart is the sample chart, worked out
 * in the browser from a made-up birthday.
 */

import { test, expect, type Page } from '@playwright/test';

/** A cheap fingerprint of the star canvas, to tell whether it moved. */
async function skyPrint(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return -1;
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4 * 11) sum = (sum + data[i] * (i % 997)) % 1_000_000_007;
    return sum;
  });
}

test('the first screen shows the pole star, and the sky turns around it', async ({ page }) => {
  await page.goto('/');
  const pole = page.locator('[data-pole-star]');
  await expect(pole).toBeVisible();
  const box = (await pole.boundingBox())!;
  expect(box.y).toBeLessThan(page.viewportSize()!.height); // on the first screen
  const before = await skyPrint(page);
  await page.waitForTimeout(600);
  expect(await skyPrint(page)).not.toBe(before);
});

test('the hero carries no decorative glow', async ({ page }) => {
  await page.goto('/');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCSS('text-shadow', 'none');
  const glows = await page.evaluate(() =>
    [...document.querySelectorAll('div')].filter((el) => getComputedStyle(el).position === 'fixed' && getComputedStyle(el).backgroundImage.includes('radial-gradient')).length);
  expect(glows).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the sky holds still', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    const before = await skyPrint(page);
    await page.waitForTimeout(600);
    expect(await skyPrint(page)).toBe(before);
  });
});

test.describe('on a wide screen', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('each walkthrough step lights its own palaces, marks itself, and the chart stays pinned', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: '一张命盘，四步读出你的人生' })).toBeAttached();
    const board = page.locator('[data-walkthrough-board]');
    const expected: Record<string, number> = { ming: 1, sanfang: 4, sihua: 3, daxian: 2 };
    for (const [step, lit] of Object.entries(expected)) {
      const item = page.locator(`li[data-step="${step}"]`);
      await item.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await expect(item).toHaveAttribute('aria-current', 'step');
      await expect(board.locator('[data-lit="true"]')).toHaveCount(lit);
    }
    // Still on screen after the last step: pinned, not scrolled away.
    const top = (await board.boundingBox())!.y;
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(200);
  });

  test('the sanfang sizheng step draws the lines', async ({ page }) => {
    await page.goto('/');
    await page.locator('li[data-step="sanfang"]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(page.locator('[data-walkthrough-board] svg line')).toHaveCount(4);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the walkthrough stacks, unpinned, with every highlight shown', async ({ page }) => {
    await page.goto('/');
    const board = page.locator('[data-walkthrough-board]');
    await board.scrollIntoViewIfNeeded();
    await expect(board).toHaveCSS('position', 'static');
    await expect(board.locator('[data-lit="true"]')).toHaveCount(12);
    await expect(board.locator('svg line')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
