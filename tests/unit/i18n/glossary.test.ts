/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The chart glossary (#59). Every term the board can show has an English
 * label with no Chinese in it. Academic renderings cite a source. Western-astrology or
 * plain substitutes are only the ones the product owner approved. Sets that are only
 * partly attested (stars, brightness, sihua) show pinyin as a whole set, with the
 * academic English kept as a gloss.
 */

import { describe, it, expect } from 'vitest';
import { generateChart } from '@/lib/ziwei/algorithm';
import { BRANCHES, SI_HUA_TABLE, STEMS } from '@/lib/ziwei/constants';
import { APPROVED_SUBSTITUTES, GLOSSARY, boardLabel, termFor, withGloss } from '@/lib/i18n/glossary';

const HAN = /[㐀-鿿豈-﫿]/;

/** Synthetic birth data across all twelve hours, both genders and a spread of dates. */
function sampleCharts() {
  const charts = [];
  for (const year of [1950, 1963, 1977, 1984, 1990, 1999, 2004, 2011]) {
    for (const month of [1, 4, 7, 10]) {
      for (const day of [5, 25]) {
        for (let hour = 0; hour < 12; hour++) {
          for (const gender of ['male', 'female'] as const) {
            charts.push(generateChart({ year, month, day, hour, gender }));
          }
        }
      }
    }
  }
  return charts;
}

/** Everything the board renders from chart data, plus the overlay names TimeNav takes from constants. */
function boardTerms(): Set<string> {
  const terms = new Set<string>([...STEMS, ...BRANCHES, '禄', '权', '科', '忌']);
  for (const names of Object.values(SI_HUA_TABLE)) names.forEach((n) => terms.add(n));
  for (const chart of sampleCharts()) {
    terms.add(chart.wuxingJuName);
    for (const palace of chart.palaces) {
      terms.add(palace.name);
      for (const star of palace.stars) {
        if (star.type !== 'major' && star.type !== 'lucky' && star.type !== 'sha') continue;
        terms.add(star.name);
        if (star.brightnessRaw) terms.add(star.brightnessRaw);
      }
    }
  }
  return terms;
}

describe('chart glossary coverage', () => {
  const terms = boardTerms();

  it('has an entry for every term the board can show', () => {
    expect([...terms].filter((t) => !termFor(t)).sort()).toEqual([]);
  });

  it('gives every board term an English label with no Chinese in it', () => {
    expect([...terms].filter((t) => HAN.test(boardLabel(t))).sort()).toEqual([]);
  });
});

describe('chart glossary rules', () => {
  it('cites a source for every academic rendering', () => {
    expect(GLOSSARY.filter((t) => t.basis === 'A' && !t.source?.trim()).map((t) => t.zh)).toEqual([]);
  });

  it('uses only the substitutes the product owner approved', () => {
    const substitutes = GLOSSARY.filter((t) => t.basis === 'B').map((t) => t.zh).sort();
    expect(substitutes).toEqual([...APPROVED_SUBSTITUTES].sort());
    expect(termFor('三方四正')?.en).toBe('trine and opposition');
    expect(termFor('大限')?.en).toBe('Decade');
    expect(termFor('流年')?.en).toBe('Year');
    expect(termFor('合盘')?.en).toBe('Compatibility');
  });

  it('never uses the Western terms the research ruled out', () => {
    const banned = /\b(benefic|malefic|synastry|dignity|domicile|exaltation|detriment|Mars|emperor)\b/i;
    expect(GLOSSARY.filter((t) => banned.test(t.en ?? '')).map((t) => t.zh)).toEqual([]);
  });

  it('writes pinyin without tone marks', () => {
    expect(GLOSSARY.filter((t) => !/^[A-Za-z0-9]+(?:[ '-][A-Za-z0-9]+)*$/.test(t.pinyin)).map((t) => t.zh)).toEqual([]);
  });

  it('shows palaces and other fully attested terms in academic English', () => {
    expect(boardLabel('命宫')).toBe('Life');
    expect(boardLabel('兄弟')).toBe('Brothers');
    expect(boardLabel('仆役')).toBe('Servants');
    expect(boardLabel('官禄')).toBe('Office');
    expect(boardLabel('水二局')).toBe('Water-2 Configuration');
    expect(termFor('五行')?.en).toBe('Five Phases');
  });

  it('shows partly attested sets as pinyin, keeping the academic English as a gloss', () => {
    expect(boardLabel('贪狼')).toBe('Tanlang');
    expect(boardLabel('天机')).toBe('Tianji');
    expect(boardLabel('庙')).toBe('Miao');
    expect(boardLabel('禄')).toBe('Lu');
    expect(boardLabel('甲')).toBe('Jia');
    expect(boardLabel('子')).toBe('Zi');
    expect(withGloss('贪狼')).toBe('Tanlang (Greedy Wolf)');
    expect(withGloss('天机')).toBe('Tianji');
    expect(withGloss('兄弟')).toBe('Brothers');
  });
});
