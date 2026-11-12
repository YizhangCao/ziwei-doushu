/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Unit tests for the WCAG color helpers behind the design-system contrast checks. */

import { describe, it, expect } from 'vitest';
import { composite, contrastRatio, parseColor } from '@/lib/design/color';

describe('parseColor(value)', () => {
  it('reads 6- and 3-digit hex, rgb() and rgba()', () => {
    expect(parseColor('#101820')).toEqual({ r: 16, g: 24, b: 32, a: 1 });
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('rgb(236, 236, 231)')).toEqual({ r: 236, g: 236, b: 231, a: 1 });
    expect(parseColor('rgba(16,24,32,0.6)')).toEqual({ r: 16, g: 24, b: 32, a: 0.6 });
  });

  it('returns null for anything else', () => {
    expect(parseColor('var(--ac)')).toBeNull();
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('#12345')).toBeNull();
  });
});

describe('composite(fg, bg)', () => {
  it('blends a translucent color over an opaque one', () => {
    expect(composite({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 })).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 });
  });
});

describe('contrastRatio(fg, bg)', () => {
  it('matches the WCAG 2.x reference values', () => {
    expect(contrastRatio(parseColor('#000')!, parseColor('#fff')!)).toBeCloseTo(21, 5);
    expect(contrastRatio(parseColor('#fff')!, parseColor('#fff')!)).toBeCloseTo(1, 5);
    // #767676 is the lightest gray that passes 4.5:1 on white.
    expect(contrastRatio(parseColor('#767676')!, parseColor('#fff')!)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(parseColor('#777777')!, parseColor('#fff')!)).toBeLessThan(4.5);
  });

  it('composites a translucent foreground over the background first', () => {
    const half = contrastRatio(parseColor('rgba(0,0,0,0.5)')!, parseColor('#fff')!);
    expect(half).toBeCloseTo(contrastRatio(parseColor('rgb(127.5,127.5,127.5)') ?? { r: 127.5, g: 127.5, b: 127.5, a: 1 }, parseColor('#fff')!), 5);
  });
});
