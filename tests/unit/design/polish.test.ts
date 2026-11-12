/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The polish pass (#98): the drift left on the live surfaces after DESIGN.md.
 * One documented step for home section headings, weight 400, the page gutter and grid,
 * no pills or italics, the legal pages on the reading layout, and type on the ramp.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

const read = (file: string) => readFileSync(file, 'utf8');
const css = read('app/globals.css');
const home = read('app/page.tsx');

/** Every opening <h2 …> tag on the home page. */
const headings = [...home.matchAll(/<h2\b[^>]*>/g)].map((m) => m[0]);

describe('home headings', () => {
  it('have one documented section step, from 30px to 48px', () => {
    expect(css).toMatch(/--fs-section:\s*clamp\(30px,[^;]*48px\);/);
  });

  it('are never bold and never an ad hoc clamp', () => {
    expect(headings.length).toBeGreaterThan(4);
    expect(headings.filter((h) => /font-bold|font-semibold|clamp\(/.test(h))).toEqual([]);
  });

  it('use the section step for every section title', () => {
    const sectionTitles = headings.filter((h) => h.includes('grad-text'));
    expect(sectionTitles.length).toBeGreaterThan(4);
    expect(sectionTitles.filter((h) => !h.includes("var(--fs-section)"))).toEqual([]);
  });

  it('give the roadmap title the 30px headline', () => {
    const roadmap = home.match(/<(h2|div)\b[^>]*>\s*\{t\('roadmap\.title'\)\}/)?.[0] ?? '';
    expect(roadmap).toContain('var(--fs-headline)');
    expect(roadmap).not.toMatch(/font-bold|text-2xl/);
  });
});

describe('home layout', () => {
  it('puts sections on the page gutter and the page grid', () => {
    expect(home).not.toMatch(/\bpx-6\b|md:px-10|lg:px-14|maxWidth: '1280px'/);
  });

  it('has no pill tags and no italics', () => {
    expect(home).not.toMatch(/borderRadius: '20px'|fontStyle: 'italic'/);
  });
});

describe('legal pages', () => {
  for (const page of ['terms', 'privacy']) {
    it(`${page} uses the reading layout, with no second header and no gold`, () => {
      const source = read(`app/${page}/page.tsx`);
      expect(source).not.toMatch(/position: 'sticky'|letterSpacing|rgba\(|borderRadius|var\(--ac\)/);
      expect(source).toContain('className="page"');
      expect(source).toContain('maxWidth: 720');
      expect(source).toMatch(/<h1[^>]*var\(--fs-headline\)/);
    });
  }

  it('no longer carry the brand label their old headers used', () => {
    for (const locale of ['zh', 'en'] as const) {
      const legal = MESSAGES[locale].legal as unknown as Record<string, Record<string, unknown>>;
      expect(legal.terms.brand).toBeUndefined();
      expect(legal.privacy.brand).toBeUndefined();
    }
  });
});

describe('type on the ramp', () => {
  it('sets the compatibility form error at caption size, with a cross mark', () => {
    const heming = read('app/heming/page.tsx');
    expect(heming).not.toContain("fontSize: '13px'");
    expect(heming).toMatch(/role="alert"[^>]*var\(--fs-caption\)[^>]*>\s*✕ \{formError\}/);
  });

  it('sets the nav wordmark on the reading step', () => {
    expect(read('components/SiteNav.tsx')).not.toContain("fontSize: '18px'");
  });
});
