import { describe, it, expect } from 'vitest';
import { serializeChartForInterpretation } from '@/lib/ai/chart-context';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '@/lib/ziwei/types';

// Synthetic person. The name and birthplace are made-up markers we can search for in the output.
const BIRTH: BirthInfo = {
  year: 1990, month: 6, day: 15, hour: 6, gender: 'female',
  name: '测试姓名甲', province: '测试省乙', city: '测试市丙',
};
const chart: ZiweiChart = generateChart(BIRTH);
const text = serializeChartForInterpretation(chart);

describe('serializeChartForInterpretation (lib/ai/chart-context.ts, #2)', () => {
  it('lists all 12 palaces, in chart order', () => {
    expect(chart.palaces).toHaveLength(12);
    let from = 0;
    for (const palace of chart.palaces) {
      const at = text.indexOf(palace.name, from);
      expect(at, `palace ${palace.name}`).toBeGreaterThanOrEqual(0);
      from = at;
    }
  });

  it('includes every star with its brightness and 四化', () => {
    for (const palace of chart.palaces) {
      for (const star of palace.stars) {
        expect(text, `star ${star.name}`).toContain(star.name);
        const brightness = star.brightnessRaw ?? star.brightness;
        if (brightness) expect(text, `brightness of ${star.name}`).toContain(brightness);
        if (star.siHua) expect(text, `四化 of ${star.name}`).toContain(star.siHua);
      }
    }
    // The sample chart really has 四化, so the check above isn't vacuous.
    expect(chart.palaces.some((p) => p.stars.some((s) => s.siHua))).toBe(true);
  });

  it('never includes birthInfo or lunarInfo (no name, birthplace, or birth date)', () => {
    expect(text).not.toContain('birthInfo');
    expect(text).not.toContain('lunarInfo');
    expect(text).not.toContain(BIRTH.name!);
    expect(text).not.toContain(BIRTH.province!);
    expect(text).not.toContain(BIRTH.city!);
    expect(text).not.toContain('1990');
  });

  it('is deterministic: the same chart always gives the same text', () => {
    expect(serializeChartForInterpretation(chart)).toBe(text);
    expect(serializeChartForInterpretation(structuredClone(chart))).toBe(text);
    expect(serializeChartForInterpretation(generateChart(BIRTH))).toBe(text);
  });
});
