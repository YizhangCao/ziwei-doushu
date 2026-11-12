/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Small locale-aware formatting helpers for the English version (#59).
 */

import type { Locale } from './locale';

/** "紫微、天府" in Chinese; "Ziwei and Tianfu" / "A, B, and C" in English. */
export function formatList(items: string[], locale: Locale): string {
  if (locale !== 'en') return items.join('、');
  return new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items);
}
