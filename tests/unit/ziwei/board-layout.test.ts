/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The order the board places its palaces in (#86): the Life Palace first,
 * then each next palace one branch back, which is the order the rules lay them out in
 * (lib/ziwei/constants.ts PALACE_NAMES_ORDER, counterclockwise on the board).
 */

import { describe, it, expect } from 'vitest';
import { placementOrder } from '@/lib/ziwei/board-layout';
import { generateChart } from '@/lib/ziwei/algorithm';

describe('placementOrder', () => {
  it('starts at the Life Palace and steps one branch back each time', () => {
    for (let ming = 0; ming < 12; ming++) {
      const order = placementOrder(ming);
      expect(order[0]).toBe(ming);
      for (let k = 1; k < 12; k++) expect(order[k]).toBe((order[k - 1] + 11) % 12);
      expect(new Set(order).size).toBe(12);
    }
  });

  it('places a real chart in the traditional palace order', () => {
    // A made-up birthday, the same synthetic data the E2E tests use.
    const chart = generateChart({ year: 1990, month: 6, day: 15, hour: 5, gender: 'female' });
    const names = placementOrder(chart.mingGongBranch).map((b) => chart.palaces.find((p) => p.branch === b)!.name);
    expect(names).toEqual(['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母']);
  });
});
