/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The Ni Haixia section of the home page, rewritten per the copy review
 * (H80 to H92, #69). It keeps its original opening line, as the product owner decided
 * on 11/12, adds no other superlatives, cites the
 * lecture for his stance, and leaves the details of his life to an "About Ni Haixia"
 * page, without the cause of death. The four teachings below the section are out of
 * scope and stay as they are.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

type Tree = { [key: string]: string | Tree };
function strings(tree: unknown): string[] {
  if (typeof tree === 'string') return [tree];
  if (tree && typeof tree === 'object') return Object.values(tree as Tree).flatMap(strings);
  return [];
}
const found = (texts: string[], banned: string[]) =>
  banned.filter((b) => texts.some((t) => t.toLowerCase().includes(b.toLowerCase())));

/** The section's own strings, without the four teachings below it. */
function section(locale: 'zh' | 'en'): string[] {
  const { teachings: _teachings, ...rest } = MESSAGES[locale].home.ni;
  return strings(rest);
}
const about = (locale: 'zh' | 'en') => strings(MESSAGES[locale].about);
const both = (locale: 'zh' | 'en') => [...section(locale), ...about(locale)];

describe('Ni Haixia section (#69)', () => {
  it('opens with "About Ni Haixia" and his name with his years', () => {
    expect(MESSAGES.zh.home.ni.eyebrow).toBe('关于倪海厦');
    expect(MESSAGES.en.home.ni.eyebrow).toBe('About Ni Haixia');
    expect(MESSAGES.zh.home.ni.title).toBe('倪海厦（1954–2012）');
    expect(MESSAGES.en.home.ni.title).toBe('Ni Haixia (1954–2012)');
  });

  it('keeps the original opening line, as the product owner decided on 11/12', () => {
    expect(MESSAGES.zh.home.ni.intro.startsWith('当代华人圈最具影响力的中医与术数大家之一<br></br>')).toBe(true);
    expect(MESSAGES.en.home.ni.intro.startsWith(
      'One of the most influential masters of Chinese medicine and the divination arts in the modern Chinese-speaking world<br></br>',
    )).toBe(true);
  });

  it('adds no other claims that cannot be checked, here or on the about page', () => {
    expect(found(both('zh'), ['传世', '公认', '必修', '关键人物', '最完整'])).toEqual([]);
    expect(found(both('en'), ['live on', 'required viewing', 'key figures', 'most complete'])).toEqual([]);
  });

  it('leaves the stats and the influence paragraph off the home page', () => {
    expect('stats' in MESSAGES.zh.home.ni).toBe(false);
    expect('stats' in MESSAGES.en.home.ni).toBe(false);
    expect(found(section('zh'), ['享年', '当代影响'])).toEqual([]);
    expect(found(section('en'), ['aged 58', 'Influence today'])).toEqual([]);
  });

  it('moves his life, teaching and approach to the about page, without the cause of death', () => {
    for (const locale of ['zh', 'en'] as const) {
      const page = MESSAGES[locale].about;
      for (const text of [page.life, page.teaching, page.approach, page.meta.title, page.meta.description]) {
        expect(text.trim()).not.toBe('');
      }
    }
    expect(MESSAGES.zh.about.life).toContain('汉唐中医学院');
    expect(found(both('zh'), ['肝癌', '死因'])).toEqual([]);
    expect(found(both('en'), ['liver cancer', 'cancer'])).toEqual([]);
  });

  it('cites the lecture for his stance on the Four Transformations', () => {
    expect(MESSAGES.zh.home.ni.stance).toContain('生年四化');
    expect(MESSAGES.zh.home.ni.source).toContain('《天纪》3上');
    expect(MESSAGES.zh.home.ni.source).toContain('00:01:17');
    expect(MESSAGES.en.home.ni.source).toContain('Tian Ji');
    expect(MESSAGES.en.home.ni.source).toContain('00:01:17');
  });

  it('names his family and institutions in the disclaimer and keeps its purpose phrase', () => {
    expect(MESSAGES.zh.home.ni.disclaimer).toContain('家属');
    expect(MESSAGES.zh.home.ni.disclaimer).toContain('机构');
    expect(MESSAGES.zh.home.ni.disclaimer).toContain('仅作文化与个人成长参考');
    expect(MESSAGES.en.home.ni.disclaimer).toContain('his family');
    expect(MESSAGES.en.home.ni.disclaimer).toContain('for cultural interest and personal growth only');
    expect(found(both('zh'), ['倪师本人'])).toEqual([]);
    expect(found(both('en'), ['Ni Haixia himself'])).toEqual([]);
  });

  it('calls him Ni Haixia, without honorifics', () => {
    expect(found(both('zh'), ['倪师', '倪海厦老师', '倪海厦先生'])).toEqual([]);
    // "Master" as a title (the old "Master · 1954 – 2012"), not the word in "influential masters".
    expect(found(both('en'), ['Master ·', 'Master Ni'])).toEqual([]);
  });
});
