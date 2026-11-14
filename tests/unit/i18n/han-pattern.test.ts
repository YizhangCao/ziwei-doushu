/**
 * The "no Chinese in English" checks each keep their own HAN pattern. Written with
 * literal characters, its second range starts at U+F900, a compatibility ideograph
 * that Unicode normalisation (NFC) silently turns into U+8C48. The range then runs
 * U+8C48 to U+FAFF and also takes in Hangul, the surrogates every emoji is made of
 * and the private use area (CodeQL js/overly-large-range). This pins what every
 * HAN pattern in tests/ and e2e/ matches.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOTS = ['tests', 'e2e'];
const DEFINITION = /const HAN = \/((?:\\.|[^\/\\\n])+)\/([a-z]*);/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const patterns = ROOTS.flatMap(sourceFiles).flatMap((path) =>
  [...readFileSync(path, 'utf8').matchAll(DEFINITION)].map((m) => ({ path, han: new RegExp(m[1], m[2]) })),
);

const char = (codePoint: number) => String.fromCodePoint(codePoint);

describe('HAN patterns in tests', () => {
  it('finds patterns to check', () => {
    expect(patterns.length).toBeGreaterThan(0);
  });

  it.each(patterns)('$path matches CJK ideographs, compatibility ones included', ({ han }) => {
    for (const codePoint of [0x3400, 0x4e00, 0x9fff, 0xf900, 0xfaff]) {
      expect(han.test(char(codePoint)), `U+${codePoint.toString(16)}`).toBe(true);
    }
  });

  it.each(patterns)('$path matches nothing else', ({ han }) => {
    const others = {
      hangul: char(0xac00),
      yi: char(0xa000),
      surrogate: '\ud83d',
      emoji: char(0x1f600),
      privateUse: char(0xe000),
      typography: 'Ziwei – “minggong”, it’s é',
    };
    for (const [name, text] of Object.entries(others)) expect(han.test(text), name).toBe(false);
  });
});
