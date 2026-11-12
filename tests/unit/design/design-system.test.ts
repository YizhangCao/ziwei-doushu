/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Guards the design system in app/globals.css (#57): every token the
 * code uses is defined, text stays readable in both themes, and the geometry,
 * motion and type rules hold. Reads the real stylesheet and source files.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { composite, contrastRatio } from '@/lib/design/color';
import { readThemeTokens, resolveColor } from '@/lib/design/css-tokens';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
const themes = readThemeTokens(css);

/** Every `var(--t-…)` name used by the app's source files. */
function usedAliasTokens(): string[] {
  const names = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(tsx?|css)$/.test(entry.name)) {
        for (const [, name] of readFileSync(join(ROOT, path), 'utf8').matchAll(/var\(--(t-[a-z0-9-]+)\)/g)) names.add(name);
      }
    }
  };
  for (const dir of ['app', 'components', 'lib']) walk(dir);
  return [...names].sort();
}

describe('app/globals.css design system', () => {
  it('defines every --t-* token the code uses, so nothing falls back to browser defaults', () => {
    const used = usedAliasTokens();
    expect(used.length).toBeGreaterThan(0);
    for (const theme of ['light', 'dark'] as const) {
      const missing = used.filter((name) => !resolveColor(`var(--${name})`, themes[theme]));
      expect(missing, theme).toEqual([]);
    }
  });

  it('defines the card-glass class that AGENTS.md and the components use', () => {
    expect(css).toMatch(/\.card-glass\s*\{[^}]*background:[^}]*border:[^}]*\}/s);
  });

  it('keeps every text token at 4.5:1 or more on every surface, in both themes', () => {
    const texts = ['--tx-0', '--tx-1', '--tx-2', '--tx-3', '--ac', '--lu', '--quan', '--ke', '--ji'];
    const surfaces = ['--bg-0', '--bg-1', '--bg-card'];
    for (const theme of ['light', 'dark'] as const) {
      const page = resolveColor('var(--bg-0)', themes[theme])!;
      for (const surfaceName of surfaces) {
        // A translucent surface (the card over the night sky) is judged on the page under it.
        const surface = composite(resolveColor(`var(${surfaceName})`, themes[theme])!, page);
        for (const textName of texts) {
          const text = resolveColor(`var(${textName})`, themes[theme])!;
          expect(contrastRatio(text, surface), `${theme}: ${textName} on ${surfaceName}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('uses one square geometry: every radius token is 2px except the pill', () => {
    for (const name of ['--r-xs', '--r-sm', '--r-md', '--r-lg', '--r-xl']) expect(themes.light[name], name).toBe('2px');
  });

  it('defines one motion language and turns motion off for prefers-reduced-motion', () => {
    expect(themes.light['--dur-1']).toBe('200ms');
    expect(themes.light['--dur-2']).toBe('600ms');
    expect(themes.light['--ease']).toBe('cubic-bezier(0.15, 1, 0.35, 1)');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\{[^}]*animation-duration:[^}]*transition-duration:/s);
  });

  it('sets Chinese in PingFang SC with normal tracking, Latin in Helvetica Neue', () => {
    const font = themes.light['--font'];
    expect(font.indexOf('"Helvetica Neue"')).toBeGreaterThanOrEqual(0);
    expect(font.indexOf('"PingFang SC"')).toBeGreaterThan(font.indexOf('"Helvetica Neue"'));
    expect(font).toMatch(/"Microsoft YaHei".*"Noto Sans SC".*sans-serif$/);
    expect(css).toMatch(/body\s*\{[^}]*letter-spacing:\s*normal/s);
  });
});
