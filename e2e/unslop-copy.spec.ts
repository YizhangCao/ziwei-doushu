/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The unslop copy pass in the browser (#90): the Chinese home page carries no
 * English eyebrows, and the terms give the real contact details in both languages.
 */

import { test, expect } from '@playwright/test';

test('the Chinese home page has no English eyebrows', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  for (const eyebrow of ['Curriculum', 'Ni Haixia · Philosophy', 'Compatibility · Analysis', 'of life']) {
    expect(text, eyebrow).not.toContain(eyebrow);
  }
});

test('the terms give the real contact details', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByText(/lyk1121762110/)).toBeVisible();
  await expect(page.getByText(/liu\.yika@northeastern\.edu/)).toBeVisible();
});

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test('the terms give the real contact details', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByText(/WeChat.*lyk1121762110/)).toBeVisible();
    await expect(page.getByText(/liu\.yika@northeastern\.edu/)).toBeVisible();
  });
});
