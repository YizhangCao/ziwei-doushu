/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The home page's Ni Haixia section (#69): a short introduction with a
 * cited stance, and a link to an "About Ni Haixia" page that holds his life, teaching
 * series and approach. Neither page mentions his cause of death or his age at death.
 */

import { test, expect } from '@playwright/test';

test('the home section introduces Ni Haixia briefly and cites its source', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('倪海厦（1954–2012）')).toBeVisible();
  await expect(page.getByRole('link', { name: /《天纪》3上/ })).toHaveAttribute('href', /bilibili\.com\/video\/BV1KJsLekEfA\?p=5&t=77/);
  await expect(page.getByText(/享年/)).toHaveCount(0);
  await expect(page.getByText(/最具影响力/)).toHaveCount(0);
});

test('the about page holds his life, teaching and approach, without the cause of death', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /生平、讲义与治学/ }).click();
  await expect(page).toHaveURL(/\/ni-haixia$/);
  await expect(page).toHaveTitle(/关于倪海厦/);
  await expect(page.getByRole('heading', { level: 1, name: '关于倪海厦' })).toBeVisible();
  await expect(page.getByText(/汉唐中医学院/)).toBeVisible();
  await expect(page.getByText(/肝癌/)).toHaveCount(0);
});
