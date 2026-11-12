/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The English version (#59). An English browser lands in English, the
 * switch in the site nav moves between the two languages and remembers the choice, the
 * chart and the classics read in English, and no Chinese shows anywhere except
 * classical originals marked lang="zh-Hans". Uses made-up birth data.
 */

import { test, expect, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

/** Chinese characters in visible text or in labels, outside elements marked as Chinese. */
async function chineseOutsideZhElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const HAN = /[㐀-鿿豈-﫿]/;
    const insideZh = (el: Element | null) => !!el?.closest('[lang^="zh"]');
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue;
      if (HAN.test(node.textContent ?? '') && !insideZh(parent)) found.push((node.textContent ?? '').trim().slice(0, 40));
    }
    for (const el of document.body.querySelectorAll('[aria-label], [placeholder], [title], [alt]')) {
      for (const attr of ['aria-label', 'placeholder', 'title', 'alt']) {
        const value = el.getAttribute(attr);
        if (value && HAN.test(value) && !insideZh(el)) found.push(`${attr}=${value.slice(0, 40)}`);
      }
    }
    if (HAN.test(document.title)) found.push(`title=${document.title}`);
    return found;
  });
}

async function buildChartInEnglish(page: Page) {
  await page.goto('/chart');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('1990');
  await selects.nth(1).selectOption('6');
  await selects.nth(2).selectOption('15');
  await page.getByRole('button', { name: 'Female' }).click();
  await page.getByRole('button', { name: 'Build chart', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Natal chart' })).toBeVisible();
}

test('an English browser lands in English, and the switch moves between languages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('button', { name: 'Switch to Chinese' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('navigation').getByRole('link', { name: '起盘' })).toBeVisible();

  // The choice is remembered across a reload.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

  await page.getByRole('button', { name: '切换到英文版' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the chart reads in English, with palace names in academic English', async ({ page }) => {
  await buildChartInEnglish(page);
  await expect(page.getByText(/^Your Life Palace is in /)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Natal' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Decade' })).toHaveCount(1);
  expect(await chineseOutsideZhElements(page)).toEqual([]);
});

test('a classical passage shows the original, then which means', async ({ page }) => {
  await page.goto('/library/quanshu/0');
  await expect(page.locator('[lang="zh-Hans"]').first()).toBeVisible();
  await expect(page.getByText(/^which means: "/).first()).toBeVisible();
});

for (const path of ['/', '/heming', '/library', '/library/quanshu', '/library/quanshu/0', '/library/search?q=minggong', '/knowledge', '/terms', '/privacy', '/no-such-page']) {
  test(`no Chinese outside marked originals on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await chineseOutsideZhElements(page)).toEqual([]);
  });
}
