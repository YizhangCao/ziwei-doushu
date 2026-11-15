/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Small locale-aware formatting helpers for the English version (#59).
 */

import type { Locale } from './locale';
import { termLabel } from './glossary';

/**
 * A palace's display name from the engine's name (#88). The engine keeps the suffix only
 * on 命宫, so Chinese adds 宫 when it is missing ("夫妻" → "夫妻宫"); English reads
 * "<glossary name> Palace" ("Marriage Palace").
 */
export function palaceName(name: string, locale: Locale): string {
  if (locale === 'en') return `${termLabel(name, locale)} Palace`;
  return name.endsWith('宫') ? name : `${name}宫`;
}

/** "紫微、天府" in Chinese; "Ziwei and Tianfu" / "A, B, and C" in English. */
export function formatList(items: string[], locale: Locale): string {
  if (locale !== 'en') return items.join('、');
  return new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items);
}
