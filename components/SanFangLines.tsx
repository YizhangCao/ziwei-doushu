/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The sanfang sizheng lines over a chart board: a 1px gold line to the
 * opposite palace, the trine triangle, and a dot on each of the four palaces. Gold is
 * chart meaning here. The lines draw in 600ms; under reduced motion they simply appear.
 */

'use client';
import { motion } from 'framer-motion';
import { BRANCH_SVG_POS, getSanFangSiZheng } from '@/lib/ziwei/board-layout';

const draw = { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 0.6, ease: [0.15, 1, 0.35, 1] as const } };

/** Lines for one palace's sanfang sizheng, sized to fill the board they sit on. */
export default function SanFangLines({ branch }: { branch: number }) {
  const [self, opposite, trineA, trineB] = getSanFangSiZheng(branch).map((b) => BRANCH_SVG_POS[b]);
  const line = { style: { stroke: 'var(--ac)' }, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const };
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} aria-hidden="true">
      {/* opposite (through the centre) and the trine triangle */}
      <motion.line x1={`${self[0]}%`} y1={`${self[1]}%`} x2={`${opposite[0]}%`} y2={`${opposite[1]}%`} {...line} {...draw} />
      <motion.line x1={`${self[0]}%`} y1={`${self[1]}%`} x2={`${trineA[0]}%`} y2={`${trineA[1]}%`} {...line} {...draw} />
      <motion.line x1={`${trineA[0]}%`} y1={`${trineA[1]}%`} x2={`${trineB[0]}%`} y2={`${trineB[1]}%`} {...line} {...draw} />
      <motion.line x1={`${trineB[0]}%`} y1={`${trineB[1]}%`} x2={`${self[0]}%`} y2={`${self[1]}%`} {...line} {...draw} />
      {[self, opposite, trineA, trineB].map((p, i) => (
        <circle key={i} cx={`${p[0]}%`} cy={`${p[1]}%`} r={i === 0 ? 3 : 2.5} style={{ fill: 'var(--ac)' }} />
      ))}
    </svg>
  );
}
