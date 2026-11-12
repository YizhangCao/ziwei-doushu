/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview English star briefs on the knowledge index (#59). Every main star with a
 * Chinese brief has an English one in direct, high-school-level English that names the
 * star in pinyin and contains no Chinese.
 */

import { describe, it, expect } from 'vitest';
import { ALL_STARS, STAR_BRIEF_SEO } from '@/lib/seo/knowledge';
import { STAR_BRIEF_EN } from '@/lib/i18n/knowledge-en';
import { boardLabel } from '@/lib/i18n/glossary';

const HAN = /[㐀-鿿豈-﫿]/;

describe('English star briefs', () => {
  it('cover every star that has a Chinese brief', () => {
    expect(ALL_STARS.filter((s) => STAR_BRIEF_SEO[s] && !STAR_BRIEF_EN[s]?.trim())).toEqual([]);
  });

  it('name the star in pinyin and contain no Chinese', () => {
    for (const star of ALL_STARS) {
      const brief = STAR_BRIEF_EN[star];
      expect(brief.startsWith(boardLabel(star)), star).toBe(true);
      expect(HAN.test(brief), star).toBe(false);
    }
  });
});
