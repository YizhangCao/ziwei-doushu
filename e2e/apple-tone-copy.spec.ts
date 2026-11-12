/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The library search after the tone pass (#94): a search with no results
 * suggests trying another word, while an empty search keeps the plain "try".
 */

import { test, expect } from '@playwright/test';

test('a search with no results suggests another word', async ({ page }) => {
  await page.goto('/library/search?q=' + encodeURIComponent('不存在的词'));
  await expect(page.getByText('没有找到这个词。')).toBeVisible();
  await expect(page.getByText('换个词试试：')).toBeVisible();
});

test('an empty search asks for a word and keeps the plain "try"', async ({ page }) => {
  await page.goto('/library/search');
  await expect(page.getByText('输入一个词，开始搜索')).toBeVisible();
  await expect(page.getByText('可以试试：')).toBeVisible();
});
