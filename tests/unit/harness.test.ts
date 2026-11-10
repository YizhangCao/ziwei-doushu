import { describe, it, expect } from 'vitest';
// Imported through the `@/` alias on purpose: this proves the Vitest config
// resolves the same paths as tsconfig.json, which every later unit test relies on.
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo } from '@/lib/ziwei/types';

// Synthetic birth data, not a real person (AGENTS.md: no real birth data in tests).
const SAMPLE: BirthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' };

describe('unit harness', () => {
  it('runs a pure lib/ function through the @/ alias', () => {
    const chart = generateChart(SAMPLE);
    expect(chart.palaces).toHaveLength(12);
  });
});
