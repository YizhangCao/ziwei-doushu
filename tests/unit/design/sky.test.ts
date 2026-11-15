/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The turning sky's motion curve (#84, DESIGN.md "The Turning Sky Rule"):
 * a calm turn at rest, faster with longer trails while the first screen scrolls away,
 * and back to calm once it has gone.
 */

import { describe, it, expect } from 'vitest';
import { skyMotion } from '@/lib/design/sky';

describe('skyMotion', () => {
  it('turns slowly at rest, with short trails', () => {
    const rest = skyMotion(0);
    expect(rest.speed).toBeGreaterThan(0);
    expect(rest.speed).toBeLessThan(0.01);
    expect(rest.fade).toBeGreaterThan(0.3); // a strong fade means short trails
  });

  it('turns fastest, with the longest trails, as the first screen leaves', () => {
    const rest = skyMotion(0);
    const half = skyMotion(0.5);
    const end = skyMotion(1);
    expect(half.speed).toBeGreaterThan(rest.speed);
    expect(end.speed).toBeGreaterThan(half.speed);
    expect(end.fade).toBeLessThan(half.fade);
    expect(end.fade).toBeGreaterThan(0); // trails always fade out
  });

  it('settles back to the calm turn once the first screen is gone', () => {
    expect(skyMotion(1.5)).toEqual(skyMotion(0));
    expect(skyMotion(4)).toEqual(skyMotion(0));
  });

  it('treats a negative scroll (overscroll bounce) as the top', () => {
    expect(skyMotion(-0.2)).toEqual(skyMotion(0));
  });
});
