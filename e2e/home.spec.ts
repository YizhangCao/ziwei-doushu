/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Home page first visit (#57): the first screen is the product and
 * one action. The upstream platform letter and the expired May promo are gone.
 */

import { test, expect } from '@playwright/test';

test('a first-time visitor sees the product and one clear action, with no letter or promo', async ({ page }) => {
  // A fresh browser context has empty localStorage, so this is a true first visit.
  await page.goto('/');

  await expect(page.getByText('紫微命盘', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '立即起盘' }).first()).toBeVisible();
  await page.waitForTimeout(1500); // the old letter and promo appeared after a short delay
  await expect(page.getByText('致正在使用这个平台的你')).toHaveCount(0);
  await expect(page.getByText('限时回馈')).toHaveCount(0);
});
