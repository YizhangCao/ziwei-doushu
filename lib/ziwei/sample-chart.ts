/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The sample chart the home walkthrough reads (#84). It comes from a made-up
 * birthday, the same synthetic data the tests use, never a real person's. The engine works
 * out the person's current age from today's date, so the walkthrough freezes the sample
 * person at one age: the copy talks about one decade, and that decade stays the current one
 * in every later year. tests/unit/ziwei/sample-chart.test.ts pins each fact the copy states.
 */

import { generateChart } from './algorithm';
import type { BirthInfo, ZiweiChart } from './types';

/** The made-up birthday: 15 June 1990, hour index 6, female. */
export const SAMPLE_BIRTH: BirthInfo = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' };

/** The age the sample person is shown at: 37, their age in 2026. */
export const SAMPLE_AGE = 37;

/** The sample chart, with the current age and decade frozen at SAMPLE_AGE. */
export function sampleChart(): ZiweiChart {
  const chart = generateChart(SAMPLE_BIRTH);
  const index = chart.daXians.findIndex((d) => SAMPLE_AGE >= d.startAge && SAMPLE_AGE <= d.endAge);
  const decade = chart.daXians[index];
  return {
    ...chart,
    currentAge: SAMPLE_AGE,
    currentDaXianIndex: index,
    palaces: chart.palaces.map((palace) => ({ ...palace, isCurrentDaXian: palace.name === decade?.palaceName })),
  };
}
