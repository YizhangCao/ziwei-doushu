/**
 * @fileoverview The compatibility page while its AI analysis isn't built (#124): it says so
 * as soon as it opens, never calls /api/heming, and the site doesn't advertise it as ready.
 */

import { test, expect } from '@playwright/test';

/** Fails the test if the page calls the compatibility endpoint at all. */
async function forbidHemingApi(page: import('@playwright/test').Page) {
  const calls: string[] = [];
  await page.route('**/api/heming', (route) => { calls.push(route.request().url()); return route.abort(); });
  return calls;
}

test('/heming says compatibility analysis is coming soon, with no start button and no API call', async ({ page }) => {
  const calls = await forbidHemingApi(page);
  await page.goto('/heming');
  await expect(page.getByRole('status').filter({ hasText: '合盘分析即将上线' })).toBeVisible();
  await expect(page.getByRole('button', { name: /开始合盘/ })).toHaveCount(0);
  expect(calls).toEqual([]);
});

test('the main navigation no longer links to /heming, and the home button says it is coming soon', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '合盘' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /合盘分析即将上线/ })).toBeVisible();
});

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test('/heming says Compatibility analysis coming soon', async ({ page }) => {
    const calls = await forbidHemingApi(page);
    await page.goto('/heming');
    await expect(page.getByRole('status').filter({ hasText: 'Compatibility analysis coming soon' })).toBeVisible();
    expect(calls).toEqual([]);
  });
});
