/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The chart reveal's timing (#86): the Life Palace on its own, the other
 * eleven one after another, then the Life Palace's sanfang sizheng lines, then the
 * current decade's gold edge, all within 1.4 s. Under reduced motion everything is at once.
 */

import { describe, it, expect } from 'vitest';
import { chartReveal } from '@/lib/design/chart-reveal';

const PLACES = Array.from({ length: 12 }, (_, k) => k);

describe('chartReveal', () => {
  const reveal = chartReveal(false);

  it('shows the Life Palace first, on its own for a moment', () => {
    expect(reveal.palace(0)).toBe(0);
    expect(reveal.palace(1) - reveal.palace(0)).toBeGreaterThan(reveal.palace(2) - reveal.palace(1));
  });

  it('places the other eleven one after another', () => {
    for (const k of PLACES.slice(1)) expect(reveal.palace(k)).toBeGreaterThan(reveal.palace(k - 1));
  });

  it('draws the lines after the last palace starts, and the decade edge after the lines', () => {
    expect(reveal.lines).toBeGreaterThan(reveal.palace(11));
    expect(reveal.decade).toBeGreaterThan(reveal.lines);
  });

  it('uses the design system reveal duration and is all in place within 1.4 s', () => {
    expect(reveal.duration).toBe(0.6); // DESIGN.md: 600 ms for reveals
    expect(reveal.decade + reveal.duration).toBeLessThanOrEqual(1.4);
  });

  it('puts everything in place at once under reduced motion', () => {
    const still = chartReveal(true);
    expect(PLACES.map((k) => still.palace(k))).toEqual(PLACES.map(() => 0));
    expect([still.lines, still.decade, still.duration]).toEqual([0, 0, 0]);
  });
});
