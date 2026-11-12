/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The knowledge pages' text comes from the message files, in both languages
 * (#88). Palace names read "<name> Palace" in English, the 13 topic labels exist in both
 * languages, and neither the knowledge pages' code nor the design sidecar holds Chinese
 * outside comments.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { palaceName } from '@/lib/i18n/format';
import { ALL_TOPICS } from '@/lib/seo/knowledge';
import { TOPIC_LABEL } from '@/lib/ziwei/db-analysis';
import { MESSAGES } from '@/messages';

const HAN = /[㐀-鿿豈-﫿]/;

/** Source text with block, JSX and line comments removed (URLs in strings are kept). */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe('palaceName', () => {
  it('adds the palace suffix in Chinese only when the name lacks it', () => {
    expect(palaceName('命宫', 'zh')).toBe('命宫');
    expect(palaceName('夫妻', 'zh')).toBe('夫妻宫');
  });

  it('reads "<name> Palace" in English', () => {
    expect(palaceName('命宫', 'en')).toBe('Life Palace');
    expect(palaceName('夫妻', 'en')).toBe('Marriage Palace');
  });
});

describe('knowledge topic labels', () => {
  it('keep the Chinese labels word for word', () => {
    for (const topic of ALL_TOPICS) expect(MESSAGES.zh.knowledge.topics[topic], topic).toBe(TOPIC_LABEL[topic]);
  });

  it('have English labels with no Chinese', () => {
    for (const topic of ALL_TOPICS) {
      const label = MESSAGES.en.knowledge.topics[topic];
      expect(label?.trim(), topic).toBeTruthy();
      expect(HAN.test(label), topic).toBe(false);
    }
  });
});

describe('no hardcoded Chinese', () => {
  it('in the knowledge pages, outside comments', () => {
    const offenders = filesUnder('app/knowledge')
      .filter((f) => f.endsWith('.tsx'))
      .flatMap((f) => withoutComments(readFileSync(f, 'utf8')).split('\n')
        .filter((line) => HAN.test(line))
        .map((line) => `${f}: ${line.trim()}`));
    expect(offenders).toEqual([]);
  });

  it('in the design sidecar', () => {
    expect(readFileSync('.impeccable/design.json', 'utf8').match(new RegExp(HAN.source, 'g')) ?? []).toEqual([]);
  });
});
