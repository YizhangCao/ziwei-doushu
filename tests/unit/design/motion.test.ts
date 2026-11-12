/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Motion moves opacity, not position (#96, DESIGN.md: "opacity and stroke only").
 * Reads the source of the home page, the time navigation and the palace cell, and fails on
 * any x or y offset in a framer-motion state (initial, animate, exit, whileInView), and on
 * a FadeIn that takes a rise.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const FILES = ['app/page.tsx', 'components/TimeNav.tsx', 'components/PalaceCell.tsx'];

/** Every motion state object in a file, as "file: state={{…}}". */
function motionStates(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/\b(initial|animate|exit|whileInView)=\{\{([^}]*)\}\}/g)].map((m) => `${file}: ${m[1]}={{${m[2]}}}`);
}

describe('motion', () => {
  it('moves opacity only: no x or y offset in any motion state', () => {
    const offsets = FILES.flatMap(motionStates).filter((state) => /\b[xy]\s*:\s*(?!0\b)[^,}\s]/.test(state));
    expect(offsets).toEqual([]);
  });

  it('has no FadeIn rise on the home page', () => {
    const source = readFileSync('app/page.tsx', 'utf8');
    expect(source).not.toMatch(/function FadeIn\([^)]*\by\s*=/s);
    expect(source).not.toMatch(/<FadeIn[^>]*\by=\{/);
  });
});
