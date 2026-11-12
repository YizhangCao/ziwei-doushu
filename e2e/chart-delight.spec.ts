/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Building a chart (#86): the board places its palaces the way the rules do,
 * from the Life Palace, then draws the Life Palace's lines and the current decade's edge;
 * and the reading panel names the stars it is reading while it waits.
 *
 * The made-up birthday (15 June 1990, 10:00, female) puts the Life Palace in chou with
 * Taiyang Hualu and Taiyin Huake, and the Marriage Palace in hai with Tiantong Huaji.
 * The AI route is mocked; no request leaves the browser.
 */

import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window { __reveal?: Record<string, number> }
}

/** The palaces in the order the rules place them, from the Life Palace. */
const PLACED = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

async function fillBirth(page: Page, female = '女') {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: female }).click();
}

/**
 * Records, frame by frame, when each palace, the Life Palace's lines and the decade edge
 * first reach half opacity. Starts before the chart is built.
 */
async function recordReveal(page: Page) {
  await page.evaluate(() => {
    const seen: Record<string, number> = {};
    window.__reveal = seen;
    const shown = (el: Element | null) => !!el && parseFloat(getComputedStyle(el).opacity) >= 0.5;
    const start = performance.now();
    const tick = () => {
      const now = performance.now();
      document.querySelectorAll('[data-palace]').forEach((el) => {
        const name = el.getAttribute('data-palace')!;
        if (!(name in seen) && shown(el)) seen[name] = now;
      });
      if (!('lines' in seen) && shown(document.querySelector('svg[data-sanfang] line'))) seen.lines = now;
      if (!('edge' in seen) && shown(document.querySelector('[data-decade-edge]'))) seen.edge = now;
      if (Object.keys(seen).length < 14 && now - start < 10_000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

const revealDone = (page: Page) =>
  expect.poll(() => page.evaluate(() => Object.keys(window.__reveal ?? {}).length), { timeout: 10_000 }).toBe(14);

test.beforeEach(async ({ page }) => {
  await page.route('**/api/interpret', () => { /* never answers: the panel keeps waiting */ });
});

test('the Life Palace comes first, the rest follow one branch back, then the lines and the decade edge', async ({ page }) => {
  await fillBirth(page);
  await recordReveal(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await revealDone(page);

  const seen = (await page.evaluate(() => window.__reveal))!;
  expect(seen[PLACED[1]]).toBeGreaterThan(seen[PLACED[0]]);
  for (let k = 1; k < PLACED.length; k++) expect(seen[PLACED[k]]).toBeGreaterThanOrEqual(seen[PLACED[k - 1]]);
  expect(seen.lines).toBeGreaterThanOrEqual(seen[PLACED[11]]);
  expect(seen.edge).toBeGreaterThanOrEqual(seen.lines);
});

test('a palace picked after the reveal draws its lines at once', async ({ page }) => {
  await fillBirth(page);
  await recordReveal(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await revealDone(page);

  const ms = await page.evaluate(() => new Promise<number>((resolve) => {
    const cell = document.querySelector<HTMLElement>('[data-palace="夫妻"]')!;
    const start = performance.now();
    cell.click();
    const tick = () => {
      const line = document.querySelector(`svg[data-sanfang="${cell.dataset.branch}"] line`);
      if (line && parseFloat(getComputedStyle(line).opacity) >= 0.5) resolve(performance.now() - start);
      else if (performance.now() - start > 3000) resolve(Infinity);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  expect(ms).toBeLessThan(500);
});

test('changing the time view does not replay the reveal', async ({ page }) => {
  await fillBirth(page);
  await recordReveal(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await revealDone(page);
  // Let the reveal's ease-out tail finish, so a dip below 1 can only mean a replay.
  await expect.poll(() => page.evaluate(() =>
    Math.min(...[...document.querySelectorAll('[data-palace]')].map((el) => parseFloat(getComputedStyle(el).opacity))))).toBe(1);

  await page.getByRole('button', { name: '大限' }).click();
  const lowest = await page.evaluate(() => new Promise<number>((resolve) => {
    let min = 1;
    let frames = 0;
    const tick = () => {
      document.querySelectorAll('[data-palace]').forEach((el) => { min = Math.min(min, parseFloat(getComputedStyle(el).opacity)); });
      if (++frames < 20) requestAnimationFrame(tick); else resolve(min);
    };
    requestAnimationFrame(tick);
  }));
  expect(lowest).toBeGreaterThan(0.99);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the board, the lines and the decade edge appear at once', async ({ page }) => {
    await fillBirth(page);
    await recordReveal(page);
    await page.getByRole('button', { name: '起盘', exact: true }).click();
    await revealDone(page);

    const seen = (await page.evaluate(() => window.__reveal))!;
    expect(new Set(Object.values(seen)).size).toBe(1); // all in the same frame
  });
});

test('while it waits, the reading panel names the Life Palace stars it is reading', async ({ page }) => {
  await fillBirth(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByText('正在读命宫：太阳化禄、太阴化科…')).toBeVisible();
});

test('while it waits on a palace, the reading panel names that palace and its stars', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/interpret', (route) => {
    if (calls++ > 0) return; // the palace reading never answers
    return route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"delta":{"text":"好"}}\n\ndata: [DONE]\n\n' });
  });
  await fillBirth(page);
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByText('好', { exact: true })).toBeVisible();

  await page.locator('[data-palace="夫妻"]').click();
  await expect(page.getByText('正在读夫妻宫：天同化忌…')).toBeVisible();
});

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test('the waiting line names the stars in English', async ({ page }) => {
    await fillBirth(page, 'Female');
    await page.getByRole('button', { name: 'Build chart', exact: true }).click();
    await expect(page.getByText('Reading the Life Palace: Taiyang (Hualu) and Taiyin (Huake)…')).toBeVisible();
  });

  test('the waiting line names a palace and its stars in English', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/interpret', (route) => {
      if (calls++ > 0) return;
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"delta":{"text":"Fine."}}\n\ndata: [DONE]\n\n' });
    });
    await fillBirth(page, 'Female');
    await page.getByRole('button', { name: 'Build chart', exact: true }).click();
    await expect(page.getByText('Fine.', { exact: true })).toBeVisible();

    await page.locator('[data-palace="夫妻"]').click();
    await expect(page.getByText('Reading the Marriage Palace: Tiantong (Huaji)…')).toBeVisible();
  });
});
