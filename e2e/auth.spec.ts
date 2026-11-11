/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Signed-out login flow: member pages redirect to /login, which
 * offers GitHub sign-in.
 */

import { test, expect } from '@playwright/test';

test('logged-out visit to /charts redirects to /login', async ({ page }) => {
  await page.goto('/charts');
  await expect(page).toHaveURL(/\/login(\?|$)/);
});

test('login page offers GitHub sign-in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '使用 GitHub 登录' })).toBeVisible();
});
