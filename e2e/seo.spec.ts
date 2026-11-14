/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Each page names itself to search engines and link previews (#65). Its
 * canonical link and og:url carry its own path, and og:title, twitter:title and
 * og:description repeat its own title and description. Before, every page inherited
 * the home page's canonical and Open Graph block from the root layout. None of these
 * pages sets a canonical of its own, so they also show the default a new page gets.
 * A missing page names no canonical URL and keeps its own title.
 *
 * Link-preview bots read the HTML as the server sends it. Search engines also run the
 * scripts, which put the metadata from the client payload into the head, and the two
 * can differ. So every check runs in both views. Only paths are compared, because the
 * origin is NEXT_PUBLIC_SITE_URL, not the test server.
 */

import { test, expect, type Page } from '@playwright/test';

const content = (page: Page, selector: string) => page.locator(selector).getAttribute('content');

/** Each route, and the path its canonical link should name when that isn't the route itself. */
const PAGES: { path: string; canonical?: string }[] = [
  { path: '/' },
  { path: '/chart' },
  { path: '/heming' },
  { path: '/library' },
  { path: '/library/quanshu' },
  { path: '/library/quanshu/0' },
  // Results for any query name the search page itself, so they aren't offered for indexing.
  { path: '/library/search?q=ziwei', canonical: '/library/search' },
  { path: '/knowledge' },
  { path: '/terms' },
  { path: '/privacy' },
];

/** An unknown route, an unknown book and an unknown chapter: each ends in the 404 page. */
const MISSING = ['/no-such-page', '/library/no-such-book', '/library/quanshu/999'];

for (const javaScriptEnabled of [false, true]) {
  test.describe(javaScriptEnabled ? 'once the scripts have run' : 'in the HTML the server sends', () => {
    test.use({ javaScriptEnabled });
    // With scripts on, wait until they have finished before reading the head.
    const waitUntil = javaScriptEnabled ? 'networkidle' : 'load';

    for (const { path, canonical = path } of PAGES) {
      test(`${path} names ${canonical} as its canonical URL, with its own title in Open Graph`, async ({ page }) => {
        await page.goto(path, { waitUntil });
        const link = page.locator('link[rel="canonical"]');
        await expect(link).toHaveCount(1);
        const href = (await link.getAttribute('href')) ?? '';
        // new URL() throws on a bare path, so this also checks the link is absolute.
        expect(new URL(href).pathname).toBe(canonical);
        expect(await content(page, 'meta[property="og:url"]')).toBe(href);

        const title = await page.title();
        expect(await content(page, 'meta[property="og:title"]')).toBe(title);
        expect(await content(page, 'meta[name="twitter:title"]')).toBe(title);
        expect(await content(page, 'meta[property="og:description"]')).toBe(await content(page, 'meta[name="description"]'));
        for (const property of ['og:site_name', 'og:locale', 'og:type']) {
          await expect(page.locator(`meta[property="${property}"]`), property).toHaveCount(1);
        }
      });
    }

    for (const path of MISSING) {
      test(`the 404 page at ${path} names no canonical URL and keeps its own title`, async ({ page }) => {
        await page.goto('/', { waitUntil });
        const homeTitle = await page.title();
        const response = await page.goto(path, { waitUntil });
        expect(response?.status()).toBe(404);

        const title = await page.title();
        expect(title).not.toBe(homeTitle);
        expect(await content(page, 'meta[property="og:title"]')).toBe(title);
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
        await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
        await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
      });
    }
  });
}
