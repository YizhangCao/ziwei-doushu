/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Motion that explains a state change (#96): switching day and night
 * crossfades the whole page in 600 ms, and changing the chart's time layer fades the new
 * overlay sihua in. Under reduced motion both changes happen at once. Uses a made-up
 * birthday; the AI route is mocked.
 */

import { test, expect, type Page } from '@playwright/test';

const THEME_SWITCH = '切换日间 / 夜间主题';

/** Clicks the day/night switch and reports the view-transition animations 50 ms later. */
async function switchTheme(page: Page) {
  return page.evaluate(async (label) => {
    const before = document.documentElement.dataset.theme;
    document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click();
    const viewFades = () => document.getAnimations()
      .map((a) => ({ pseudo: String((a.effect as KeyframeEffect | null)?.pseudoElement ?? ''), duration: a.effect?.getTiming().duration }))
      .filter((a) => a.pseudo.startsWith('::view-transition-old') || a.pseudo.startsWith('::view-transition-new'));
    // The transition first snapshots the old page, so its animations start a frame or more
    // after the click; under load that can take a while. Look every frame for up to a second.
    const start = performance.now();
    let fades = viewFades();
    while (fades.length === 0 && performance.now() - start < 1000) {
      await new Promise((r) => requestAnimationFrame(r));
      fades = viewFades();
    }
    await new Promise((r) => setTimeout(r, 50));
    return { before, after: document.documentElement.dataset.theme, fades };
  }, THEME_SWITCH);
}

/** Builds the sample chart, switches to the decade layer, and samples the overlay badges' opacity. */
async function decadeBadges(page: Page) {
  await page.route('**/api/interpret', () => { /* never answers */ });
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.locator('#bf-hour').selectOption('10');
  await page.getByRole('button', { name: '女' }).click();
  await page.getByRole('button', { name: '起盘', exact: true }).click();
  await expect(page.getByRole('region', { name: '命盘' })).toBeVisible();
  await page.waitForTimeout(1600); // let the chart reveal finish
  return page.evaluate(async () => {
    const opacities = () => [...document.querySelectorAll<HTMLElement>('.sihua-badge')]
      .filter((b) => getComputedStyle(b).borderStyle === 'dashed')
      .map((b) => Number(getComputedStyle(b.parentElement!).opacity));
    [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith('大限'))!.click(); // "大限 36–45"
    await new Promise((r) => setTimeout(r, 50));
    const early = opacities();
    await new Promise((r) => setTimeout(r, 500));
    return { early, late: opacities() };
  });
}

test('switching day and night crossfades the whole page in 600 ms', async ({ page }) => {
  await page.goto('/');
  const { before, after, fades } = await switchTheme(page);
  expect(after).not.toBe(before);
  expect(fades.length).toBeGreaterThan(0);
  for (const fade of fades) expect(fade.duration).toBe(600);
});

test('switching the time layer fades the new sihua in', async ({ page }) => {
  const { early, late } = await decadeBadges(page);
  expect(early.length).toBeGreaterThan(0);
  expect(Math.min(...early)).toBeLessThan(1);
  expect(late.every((o) => o === 1)).toBe(true);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('day and night switch at once', async ({ page }) => {
    await page.goto('/');
    const { before, after, fades } = await switchTheme(page);
    expect(after).not.toBe(before);
    expect(fades).toEqual([]);
  });

  test('the new sihua simply appear', async ({ page }) => {
    const { early } = await decadeBadges(page);
    expect(early.length).toBeGreaterThan(0);
    expect(early.every((o) => o === 1)).toBe(true);
  });
});
