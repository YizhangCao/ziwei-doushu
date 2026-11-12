/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The home walkthrough's sample chart (#84). Its copy states chart facts in
 * words ("the Life Palace is in Zi and holds Wuqu and Tianfu…"), so every fact it names is
 * pinned here against the engine. The sample person is frozen at one age, so the decade
 * the copy talks about stays the current one in any year.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { SAMPLE_AGE, sampleChart } from '@/lib/ziwei/sample-chart';
import { MESSAGES } from '@/messages';

const stars = (chart: ReturnType<typeof sampleChart>, palace: string) =>
  chart.palaces.find((p) => p.name === palace)!.stars.filter((s) => s.type === 'major').map((s) => `${s.name}${s.siHua ?? ''}`);

describe('sampleChart', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('has every chart fact the walkthrough copy names', () => {
    const chart = sampleChart();
    expect(chart.mingGongBranch).toBe(0); // Zi
    expect(chart.wuxingJuName).toBe('火六局');
    expect(chart.mingZhu).toBe('贪狼');
    expect(stars(chart, '命宫')).toEqual(['武曲权', '天府']);
    expect(stars(chart, '官禄')).toEqual(['紫微', '天相']);
    expect(stars(chart, '迁移')).toEqual(['七杀']);
    expect(stars(chart, '财帛')).toEqual(['廉贞']);
    expect(stars(chart, '父母')).toEqual(['太阳禄', '太阴科']);
    expect(stars(chart, '兄弟')).toEqual(['天同忌']);
    expect(stars(chart, '子女')).toEqual([]);
    expect(stars(chart, '田宅')).toEqual(['天机', '巨门']);
  });

  it('freezes the sample person at one age, in the Children Palace decade', () => {
    const chart = sampleChart();
    expect(SAMPLE_AGE).toBe(37);
    expect(chart.currentAge).toBe(SAMPLE_AGE);
    expect(chart.palaces.filter((p) => p.isCurrentDaXian).map((p) => p.name)).toEqual(['子女']);
    expect(chart.daXians[chart.currentDaXianIndex]).toMatchObject({ startAge: 36, endAge: 45, palaceName: '子女' });
  });

  it('reads the same in a later year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2040-03-01T00:00:00Z'));
    const chart = sampleChart();
    expect(chart.currentAge).toBe(SAMPLE_AGE);
    expect(chart.palaces.filter((p) => p.isCurrentDaXian).map((p) => p.name)).toEqual(['子女']);
  });

  it('is what the copy describes, in both languages', () => {
    const zh = MESSAGES.zh.home.walkthrough.steps;
    for (const word of ['命宫在子', '武曲', '天府', '化权']) expect(zh.ming.body).toContain(word);
    for (const word of ['紫微', '天相', '七杀', '廉贞']) expect(zh.sanfang.body).toContain(word);
    for (const word of ['太阳化禄', '太阴化科', '天同化忌']) expect(zh.sihua.body).toContain(word);
    for (const word of ['子女宫', '田宅', '天机', '巨门']) expect(zh.daxian.body).toContain(word);
    const en = MESSAGES.en.home.walkthrough.steps;
    for (const word of ['Zi', 'Wuqu', 'Tianfu', 'Huaquan']) expect(en.ming.body).toContain(word);
    for (const word of ['Children Palace', 'Estate Palace', 'Tianji', 'Jumen']) expect(en.daxian.body).toContain(word);
  });
});
