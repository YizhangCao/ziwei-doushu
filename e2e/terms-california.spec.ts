/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/** @fileoverview The terms page shows section 6 under California law, with arbitration (#100). */

import { test, expect } from '@playwright/test';

test('the terms put disputes under California law, with arbitration and an opt-out', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: '6. 法律适用、仲裁与争议解决' })).toBeVisible();
  await expect(page.getByText('（a）适用法律。', { exact: true })).toBeVisible(); // the bold part title
  await expect(page.getByText(/美国仲裁协会（AAA）/)).toBeVisible();
  await expect(page.getByText(/退出本仲裁约定/)).toBeVisible();
  await expect(page.getByText(/中华人民共和国/)).toHaveCount(0);
});

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test('the terms put disputes under California law, with arbitration and an opt-out', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: '6. Governing Law, Arbitration and Dispute Resolution' })).toBeVisible();
    await expect(page.getByText('(a) Governing law.', { exact: true })).toBeVisible();
    await expect(page.getByText(/American Arbitration Association \(AAA\)/)).toBeVisible();
    await expect(page.getByText(/opt out of this arbitration agreement/)).toBeVisible();
  });
});
