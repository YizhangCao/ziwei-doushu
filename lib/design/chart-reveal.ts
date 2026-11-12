/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The chart reveal (#86, DESIGN.md "Chart Reveal"). When a chart is built,
 * the board lays itself out the way the rules do: the Life Palace on its own, then the
 * other eleven one branch back at a time, then the Life Palace's sanfang sizheng lines,
 * and last the current decade's gold edge. Opacity and stroke only, all in place within
 * 1.4 s, and never in the way of a click. Under reduced motion everything is there at once.
 */

/** Seconds from the moment the board mounts. */
export interface ChartReveal {
  /** When the palace at place k starts to fade in; place 0 is the Life Palace. */
  palace: (k: number) => number;
  /** When the centre and the Life Palace's sanfang sizheng lines start. */
  lines: number;
  /** When the current decade's gold edge starts. */
  decade: number;
  /** How long each fade or line draw takes. */
  duration: number;
}

/** DESIGN.md's reveal duration. */
const DURATION = 0.6;
/** The Life Palace stands alone this long before the next palace starts. */
const FIRST_GAP = 0.15;
/** Then one palace starts every 40 ms (the board's stagger before #86). */
const STEP = 0.04;
/** Each later beat starts 100 ms after the one before, so the order reads. */
const BEAT = 0.1;

const LAST_PALACE = FIRST_GAP + 10 * STEP;

const FULL: ChartReveal = {
  palace: (k) => (k === 0 ? 0 : FIRST_GAP + (k - 1) * STEP),
  lines: LAST_PALACE + BEAT,
  decade: LAST_PALACE + 2 * BEAT,
  duration: DURATION,
};

const STILL: ChartReveal = { palace: () => 0, lines: 0, decade: 0, duration: 0 };

/** The reveal's timing, or no motion at all when the visitor asks for reduced motion. */
export function chartReveal(reducedMotion: boolean): ChartReveal {
  return reducedMotion ? STILL : FULL;
}
