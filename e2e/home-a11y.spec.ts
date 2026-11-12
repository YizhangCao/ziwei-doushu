/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Home page accessibility fixes from the impeccable audit (#81): one main
 * landmark, real headings for the manifesto and roadmap, star and sihua toggles that
 * report their state and announce what they open, readable selected sihua chips,
 * footer text at 4.5:1 or better in both themes, and 44px toggles on touch screens.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * Contrast of an element's text against what is actually behind it: the first opaque
 * background up the tree with any translucent layers composited on top, and the text
 * color faded by every ancestor's opacity, the way the browser paints it.
 */
async function contrast(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    type RGBA = { r: number; g: number; b: number; a: number };
    const parse = (value: string): RGBA => {
      const srgb = value.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
      if (srgb) return { r: +srgb[1] * 255, g: +srgb[2] * 255, b: +srgb[3] * 255, a: srgb[4] === undefined ? 1 : +srgb[4] };
      const p = (value.match(/rgba?\(([^)]+)\)/)?.[1] ?? '0,0,0,0').split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
    };
    const over = (top: RGBA, base: RGBA): RGBA => ({
      r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1,
    });
    const layers: RGBA[] = [];
    let opacity = 1;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      opacity *= Number(style.opacity);
      const bg = parse(style.backgroundColor);
      if (bg.a > 0 && (layers.length === 0 || layers[layers.length - 1].a < 1)) layers.push(bg);
    }
    let base: RGBA = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) base = over(layer, base);
    const fg = parse(getComputedStyle(el).color);
    const text = over({ ...fg, a: fg.a * opacity }, base);
    const lum = (c: RGBA) => {
      const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const [hi, lo] = [lum(text), lum(base)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  });
}

async function openHome(page: Page, theme: 'dark' | 'light') {
  // The layout script reads this key before paint; a fresh context has none, so night is the default.
  await page.addInitScript((value) => { try { localStorage.setItem('ziwei-theme', value); } catch { /* ignore */ } }, theme);
  await page.goto('/');
}

test('the home page has one main landmark, with the footer outside it', async ({ page }) => {
  await openHome(page, 'dark');
  const main = page.getByRole('main');
  await expect(main).toHaveCount(1);
  await expect(main.getByRole('heading', { level: 1, name: '紫微命盘' })).toBeAttached();
  await expect(main.locator('footer')).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(1);
});

test('the manifesto and the roadmap have real headings', async ({ page }) => {
  await openHome(page, 'dark');
  await expect(page.getByRole('heading', { name: '命 · 运 · 观' })).toBeAttached();
  await expect(page.getByRole('heading', { name: '倪师方法论 · 渐次展开' })).toBeAttached();
});

test('star toggles report their state and announce the brief they open', async ({ page }) => {
  await openHome(page, 'dark');
  const ziwei = page.getByRole('button', { name: '紫微', exact: true });
  await expect(ziwei).toHaveAttribute('type', 'button');
  await expect(ziwei).toHaveAttribute('aria-pressed', 'false');
  await ziwei.scrollIntoViewIfNeeded();
  await ziwei.click();
  await expect(ziwei).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: '天皇贵星' })).toBeVisible();
});

for (const theme of ['dark', 'light'] as const) {
  test(`a selected sihua chip keeps its label readable (${theme})`, async ({ page }) => {
    await openHome(page, theme);
    const lu = page.getByRole('button', { name: '化禄', exact: true });
    await expect(lu).toHaveAttribute('type', 'button');
    await lu.scrollIntoViewIfNeeded();
    await lu.click();
    await expect(lu).toHaveAttribute('aria-pressed', 'true');
    expect(await contrast(lu)).toBeGreaterThanOrEqual(3);
  });

  test(`footer text meets 4.5:1 (${theme})`, async ({ page }) => {
    await openHome(page, theme);
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    for (const text of ['倪师方法论 · 学术体系', '天纪', '12 月 开放', /本平台基于中国传统文化研究/]) {
      const target = footer.getByText(text, { exact: typeof text === 'string' }).first();
      expect(await contrast(target), String(text)).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

  test('star and sihua toggles are at least 44px tall', async ({ page }) => {
    await openHome(page, 'dark');
    for (const name of ['紫微', '贪狼', '化禄', '化忌']) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox();
      expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44);
    }
  });
});
