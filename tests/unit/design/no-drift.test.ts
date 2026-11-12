/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Keeps the core screens on the design system (#57): no hard-coded
 * colors, no text under 12px, no wide or tight tracking on Chinese, no scale or
 * lift motion, and gold only where it carries chart meaning. Reads the source the
 * way design-system.test.ts reads the stylesheet.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

/** The screens a new user goes through, from landing to the first reading. */
const CORE = [
  'app/page.tsx',
  'app/chart/page.tsx',
  'app/heming/page.tsx',
  'components/SiteNav.tsx',
  'components/BirthForm.tsx',
  'components/ChartBoard.tsx',
  'components/PalaceCell.tsx',
  'components/TimeNav.tsx',
  'components/InsightPanel.tsx',
  'components/AiContent.tsx',
];

/** Gold (the accent) is for chart meaning: stars, sihua, the life palace, the current decade, AI headers. */
const GOLD_ALLOWED = new Set(['components/ChartBoard.tsx', 'components/PalaceCell.tsx', 'components/InsightPanel.tsx', 'components/AiContent.tsx']);

/** Source without comments, so issue numbers like #57 in comments don't count as colors. */
function code(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Every match of `pattern` in `path`, as "file: match". */
function offenders(path: string, pattern: RegExp, keep: (m: RegExpMatchArray) => boolean = () => true): string[] {
  return [...code(path).matchAll(pattern)].filter(keep).map((m) => `${path}: ${m[0]}`);
}

describe('core screens stay on the design system', () => {
  it('use tokens, not hex or rgba color literals', () => {
    const found = CORE.flatMap((f) => offenders(f, /#[0-9a-fA-F]{3,8}\b|rgba?\(/g));
    expect(found).toEqual([]);
  });

  it('never set text below 12px (Polestar caption floor)', () => {
    const tooSmall = (m: RegExpMatchArray) => Number(m[1]) < 12;
    const found = CORE.flatMap((f) => [
      ...offenders(f, /text-\[(\d+(?:\.\d+)?)px\]/g, tooSmall),
      ...offenders(f, /fontSize:\s*'?(\d+(?:\.\d+)?)(?:px)?'?/g, tooSmall),
    ]);
    expect(found).toEqual([]);
  });

  it('keep Chinese at normal tracking (Apple China): no tracking utilities or letter-spacing over 0.08em', () => {
    const over = (limit: number) => (m: RegExpMatchArray) => Math.abs(Number(m[1])) > limit;
    const found = CORE.flatMap((f) => [
      ...offenders(f, /tracking-(?:wide|wider|widest|tight|tighter)\b/g),
      ...offenders(f, /tracking-\[(-?\d*\.?\d+)em\]/g, over(0.08)),
      ...offenders(f, /letterSpacing:\s*'(-?\d*\.?\d+)em'/g, over(0.08)),
      ...offenders(f, /letterSpacing:\s*'(-?\d*\.?\d+)px'/g, over(1)),
    ]);
    expect(found).toEqual([]);
  });

  it('move only by opacity and small rises: no scale, no hover lift', () => {
    const found = CORE.flatMap((f) => [
      ...offenders(f, /\bscale\s*:/g),
      ...offenders(f, /while(?:Hover|Tap)=\{\{[^}]*\by\s*:/g),
    ]);
    expect(found).toEqual([]);
  });

  it('use gold only on chart meaning', () => {
    const found = CORE.filter((f) => !GOLD_ALLOWED.has(f)).flatMap((f) => offenders(f, /var\(--(?:ac|ac-bdr|ac-bg|t-gold|t-border-acc)\)/g));
    expect(found).toEqual([]);
  });
});
