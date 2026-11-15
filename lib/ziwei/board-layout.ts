/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Where the twelve palaces sit on the 4×4 board, and which palaces form a
 * palace's sanfang sizheng. Shared by the chart page's board and the home page's chart
 * walkthrough, so both draw the same board and the same lines.
 */

/** Grid position of each earthly branch: [row, column], 1-based, with the centre 2×2 left empty. */
export const BRANCH_GRID_POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

/** Centre of each branch's cell, in percent of the board, for the lines drawn over it. */
export const BRANCH_SVG_POS: Record<number, [number, number]> = {
  5: [12.5, 12.5], 6: [37.5, 12.5], 7: [62.5, 12.5], 8: [87.5, 12.5],
  4: [12.5, 37.5],                                      9: [87.5, 37.5],
  3: [12.5, 62.5],                                     10: [87.5, 62.5],
  2: [12.5, 87.5], 1: [37.5, 87.5], 0: [62.5, 87.5], 11: [87.5, 87.5],
};

/** Sanfang sizheng: the palace itself, its opposite, and the two palaces in a trine with it. */
export function getSanFangSiZheng(branch: number): [number, number, number, number] {
  return [
    branch,
    (branch + 6) % 12, // opposite
    (branch + 4) % 12, // trine
    (branch + 8) % 12, // trine
  ];
}
