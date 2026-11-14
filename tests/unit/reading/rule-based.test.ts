import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildRuleBasedReading } from '@/lib/reading/rule-based';
import { generateChart } from '@/lib/ziwei/algorithm';
import { boardLabel } from '@/lib/i18n/glossary';
import { STAR_KEYWORDS_EN } from '@/lib/i18n/knowledge-en';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';

// Synthetic person. The name and birthplace are made-up markers we can search for in the output.
const BIRTH: BirthInfo = {
  year: 1990, month: 6, day: 15, hour: 6, gender: 'female',
  name: '测试姓名甲', province: '测试省乙', city: '测试市丙',
};
const chart: ZiweiChart = generateChart(BIRTH);

const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;

const majors = (branch: number) =>
  chart.palaces.find((p) => p.branch === branch)!.stars.filter((s) => s.type === 'major');

afterEach(() => { vi.useRealTimers(); });

describe('buildRuleBasedReading (lib/reading/rule-based.ts)', () => {
  it('covers all 12 palaces, in chart order, each with its own palace name', () => {
    const reading = buildRuleBasedReading(chart, 'zh');
    expect(reading.palaces).toHaveLength(12);
    expect(reading.palaces.map((p) => p.branch)).toEqual(chart.palaces.map((p) => p.branch));
    reading.palaces.forEach((section, i) => {
      expect(section.title).toContain(chart.palaces[i].name.replace(/宫$/, ''));
      expect(section.domain.length).toBeGreaterThan(0);
      expect(section.text.length).toBeGreaterThan(0);
    });
  });

  it('names every major star of a palace, with its 四化, in that palace’s section', () => {
    const reading = buildRuleBasedReading(chart, 'zh');
    for (const section of reading.palaces) {
      const stars = majors(section.branch);
      expect(section.stars.map((s) => s.name)).toEqual(stars.map((s) => s.name));
      for (const star of stars) {
        expect(section.text, `${star.name} in ${section.title}`).toContain(star.name);
        if (star.siHua) expect(section.text, `四化 of ${star.name}`).toContain(`化${star.siHua}`);
      }
    }
    // The sample chart really has 四化 on a major star, so the check above isn't vacuous.
    expect(chart.palaces.some((p) => p.stars.some((s) => s.type === 'major' && s.siHua))).toBe(true);
  });

  it('reads an empty palace through the stars it borrows from the opposite palace', () => {
    const empty = chart.palaces.find((p) => p.isEmpty && p.borrowedStars?.length);
    expect(empty, 'the sample chart has an empty palace').toBeDefined();
    const section = buildRuleBasedReading(chart, 'zh').palaces.find((p) => p.branch === empty!.branch)!;
    expect(section.stars).toEqual([]);
    for (const star of empty!.borrowedStars!) expect(section.text).toContain(star);
  });

  it('opens with an overview of the life palace', () => {
    const reading = buildRuleBasedReading(chart, 'zh');
    const ming = chart.palaces.find((p) => p.isMingGong)!;
    expect(reading.overview).toContain('命宫');
    for (const star of majors(ming.branch)) expect(reading.overview).toContain(star.name);
  });

  it('is deterministic: the same chart gives the same reading on any day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const first = buildRuleBasedReading(chart, 'zh');
    vi.setSystemTime(new Date('2031-07-15T12:00:00Z'));
    const second = buildRuleBasedReading(structuredClone(chart), 'zh');
    expect(second).toEqual(first);
  });

  it('never uses birthInfo or lunarInfo', () => {
    const reading = buildRuleBasedReading(chart, 'zh');
    const text = JSON.stringify(reading);
    for (const marker of ['测试姓名甲', '测试省乙', '测试市丙', 'birthInfo', 'lunarInfo', '1990']) {
      expect(text).not.toContain(marker);
    }
    // Changing only the birth details doesn't change a word.
    const other: ZiweiChart = {
      ...chart,
      birthInfo: { ...chart.birthInfo, name: '另一个人', gender: 'male', year: 2001 },
      lunarInfo: { ...chart.lunarInfo, lunarYear: 2001 },
    };
    expect(buildRuleBasedReading(other, 'zh')).toEqual(reading);
  });

  it('works in English: English palace names and pinyin star names', () => {
    const zh = buildRuleBasedReading(chart, 'zh');
    const en = buildRuleBasedReading(chart, 'en');
    expect(en.palaces).toHaveLength(12);
    const ming = en.palaces.find((p) => p.branch === chart.mingGongBranch)!;
    expect(ming.title).toContain('Life');
    expect(ming.title).not.toMatch(/[一-鿿]/);
    for (const section of en.palaces) {
      for (const star of majors(section.branch)) expect(section.text).toContain(boardLabel(star.name));
      expect(section.domain).not.toMatch(/[一-鿿]/);
    }
    expect(en.overview).not.toEqual(zh.overview);
  });

  it('leaves no Chinese in the English reading, star keywords included, for any chart (#118)', () => {
    for (const year of [1950, 1975, 1990, 2005]) {
      for (const month of [1, 6, 11]) {
        for (let hour = 0; hour < 12; hour++) {
          for (const gender of ['male', 'female'] as const) {
            const en = buildRuleBasedReading(generateChart({ year, month, day: 15, hour, gender }), 'en');
            const where = `${year}-${month} hour ${hour} ${gender}`;
            expect(en, where).not.toHaveProperty('note');
            expect(en.overview, where).not.toMatch(HAN);
            for (const section of en.palaces) expect(`${section.title} ${section.domain} ${section.text}`, where).not.toMatch(HAN);
          }
        }
      }
    }
  });

  it('gives every main star three plain English keywords, in the same order as the Chinese (#118)', () => {
    expect(Object.keys(STAR_KEYWORDS_EN).sort()).toEqual(Object.keys(STAR_DESCRIPTIONS).sort());
    for (const [star, { keywords }] of Object.entries(STAR_DESCRIPTIONS)) {
      expect(STAR_KEYWORDS_EN[star], star).toHaveLength(keywords.split('·').length);
      for (const word of STAR_KEYWORDS_EN[star]) expect(word, star).toMatch(/^[a-z][a-z ()’-]*$/);
    }

    const en = buildRuleBasedReading(chart, 'en');
    for (const section of en.palaces) {
      for (const star of majors(section.branch)) expect(section.text).toContain(STAR_KEYWORDS_EN[star.name].join(', '));
    }
  });

  it('separates stars with a semicolon, so one star’s keywords never run into the next star (#118)', () => {
    // The first palace with two or more main stars, across a spread of charts.
    let found: { chart: ZiweiChart; branch: number; names: string[] } | undefined;
    for (let hour = 0; hour < 12 && !found; hour++) {
      const c = generateChart({ year: 1990, month: 6, day: 15, hour, gender: 'female' });
      const p = c.palaces.find((x) => x.stars.filter((s) => s.type === 'major').length >= 2);
      if (p) found = { chart: c, branch: p.branch, names: p.stars.filter((s) => s.type === 'major').map((s) => s.name) };
    }
    expect(found).toBeDefined();
    const { chart: c, branch, names } = found!;

    const zh = buildRuleBasedReading(c, 'zh').palaces.find((p) => p.branch === branch)!.text;
    const en = buildRuleBasedReading(c, 'en').palaces.find((p) => p.branch === branch)!.text;
    for (const name of names.slice(1)) {
      expect(zh).toContain(`；${name}`);
      expect(zh).not.toContain(`、${name}`);
      expect(en).toContain(`; ${boardLabel(name)}`);
    }
  });
});
