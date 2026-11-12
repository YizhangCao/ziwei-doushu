/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Makes every framer-motion animation respect the visitor's
 * "reduce motion" setting (#57). The CSS rule in globals.css only covers CSS
 * animations; framer-motion animates in JavaScript.
 */

'use client';

import { MotionConfig } from 'framer-motion';

/** Wraps the app so framer-motion skips transform and layout animations under reduced motion. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
