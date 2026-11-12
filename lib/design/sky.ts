/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The turning sky's motion curve (DESIGN.md "The Turning Sky Rule", #84).
 * The home page's stars turn slowly around the pole star at rest; while the first screen
 * scrolls away they turn faster and leave longer trails, and once it has gone they settle
 * back to the calm turn so the page below reads in peace.
 */

/** How fast the sky turns (radians per second) and how strongly each frame fades the last (0 to 1). */
export interface SkyMotion {
  speed: number;
  fade: number;
}

const REST_SPEED = 0.006;
const PEAK_EXTRA_SPEED = 0.3;
const REST_FADE = 0.4;
const PEAK_FADE_DROP = 0.34;
const MIN_FADE = 0.06;

/**
 * The sky's motion for a scroll position, where 0 is the top of the page and 1 is the end
 * of the first screen. The boost rises to 1 there, then falls back to 0 by 1.5.
 */
export function skyMotion(progress: number): SkyMotion {
  const boost = progress <= 1 ? Math.max(progress, 0) : Math.max(0, 1 - (progress - 1) * 2);
  return {
    speed: REST_SPEED + boost * boost * PEAK_EXTRA_SPEED,
    fade: Math.max(MIN_FADE, REST_FADE - boost * PEAK_FADE_DROP),
  };
}
