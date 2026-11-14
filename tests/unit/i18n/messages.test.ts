/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The two message catalogs stay in step (#59). Every Chinese key has an
 * English twin with the same ICU arguments, and no English message contains Chinese.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

type Tree = { [key: string]: string | Tree };
const HAN = /[㐀-鿿豈-﫿]/;

function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [p, v] of leaves(value, path)) out.set(p, v);
  }
  return out;
}

/** Top-level ICU argument names, skipping the bodies of plural/select branches. */
function icuArgs(message: string): string[] {
  const args = new Set<string>();
  let i = 0;
  while (i < message.length) {
    if (message[i] !== '{') { i++; continue; }
    const match = /^\{\s*([A-Za-z_]\w*)\s*([,}])/.exec(message.slice(i));
    if (!match) { i++; continue; }
    args.add(match[1]);
    if (match[2] === '}') { i += match[0].length; continue; }
    // A plural or select argument: skip to its matching closing brace.
    let depth = 0;
    for (; i < message.length; i++) {
      if (message[i] === '{') depth++;
      else if (message[i] === '}' && --depth === 0) { i++; break; }
    }
  }
  return [...args].sort();
}

const zh = leaves(MESSAGES.zh as unknown as Tree);
const en = leaves(MESSAGES.en as unknown as Tree);

describe('message catalogs', () => {
  it('have exactly the same keys in Chinese and English', () => {
    expect([...en.keys()].sort()).toEqual([...zh.keys()].sort());
  });

  it('cover every namespace the UI uses', () => {
    const namespaces = Object.keys(MESSAGES.zh).sort();
    for (const ns of ['birthForm', 'board', 'chart', 'heming', 'home', 'insight', 'knowledge', 'legal', 'library', 'meta', 'nav', 'notFound', 'timeNav']) {
      expect(namespaces).toContain(ns);
    }
  });

  it('use the same ICU arguments in both languages', () => {
    const mismatched = [...zh].filter(([key, value]) => en.has(key) && icuArgs(value).join() !== icuArgs(en.get(key)!).join());
    expect(mismatched.map(([key]) => key)).toEqual([]);
  });

  it('contain no Chinese characters in English', () => {
    const chinese = [...en].filter(([, value]) => HAN.test(value)).map(([key]) => key);
    expect(chinese).toEqual([]);
  });

  it('have no empty English messages', () => {
    expect([...en].filter(([, value]) => value.trim() === '').map(([key]) => key)).toEqual([]);
  });
});

describe('icuArgs', () => {
  it('reads simple and plural arguments and ignores branch text', () => {
    expect(icuArgs('{n} 章')).toEqual(['n']);
    expect(icuArgs('{n, plural, one {# chapter} other {# chapters}} in {book}')).toEqual(['book', 'n']);
    expect(icuArgs('no arguments')).toEqual([]);
  });
});
