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
  // The first screen offers exactly one primary action.
  await expect(page.getByRole('button', { name: '起盘', exact: true }).first()).toBeInViewport();
  await page.waitForTimeout(1500); // the old letter and promo appeared after a short delay
  await expect(page.getByText('致正在使用这个平台的你')).toHaveCount(0);
  await expect(page.getByText('限时回馈')).toHaveCount(0);
});

test('the roadmap runs from Ziwei in November to Renji in February', async ({ page }) => {
  await page.goto('/');

  // Timeline labels: Ziwei (live) in November, then one module a month.
  for (const month of ['11 月', '12 月', '1 月', '2 月']) {
    await expect(page.getByText(month, { exact: true }).first()).toBeAttached();
  }
  // The bottom nav says when each module that is not open yet opens.
  const navCard = (name: string, opens: string) => page.locator('a', { hasText: name }).filter({ hasText: opens });
  await expect(navCard('天纪', '12 月 开放')).toHaveCount(1);
  await expect(navCard('地纪', '1 月 开放')).toHaveCount(1);
  await expect(navCard('人纪', '2 月 开放')).toHaveCount(1);
  await expect(page.getByText('筹备中')).toHaveCount(0);
});
