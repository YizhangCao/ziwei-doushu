/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The home hero opens directly with the site name (#73): the small line
 * above it is gone in both languages, as the product owner asked on 11/12.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

describe('home hero', () => {
  it('has no eyebrow line in either language', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect('eyebrow' in MESSAGES[locale].home.hero).toBe(false);
    }
    expect(JSON.stringify(MESSAGES.zh.home)).not.toContain('紫微斗数 · 倪海厦体系');
    expect(JSON.stringify(MESSAGES.en.home)).not.toContain('Purple Star Astrology) · Ni Haixia');
  });

  it('keeps the rest of the hero', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(Object.keys(MESSAGES[locale].home.hero)).toEqual(['title', 'claim', 'subclaim', 'cta']);
    }
  });
});
