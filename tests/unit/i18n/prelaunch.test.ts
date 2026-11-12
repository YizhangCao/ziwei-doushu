/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Pre-launch copy fixes from the copy review (#63). The site must not
 * claim fate is fixed, push verdict-seeking questions, contradict itself about flying
 * stars, describe features it doesn't have, threaten its users, or present modern
 * summaries of the classics as original text. These checks pin each fix in both
 * languages so a later copy edit can't quietly bring one back.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MESSAGES } from '@/messages';
import { ALL_BOOKS } from '@/lib/classics';
import { PARAGRAPH_EN } from '@/lib/classics/en';
import { systemPrompt } from '@/lib/ai/interpret';

type Tree = { [key: string]: string | Tree };
function strings(tree: unknown): string[] {
  if (typeof tree === 'string') return [tree];
  if (tree && typeof tree === 'object') return Object.values(tree as Tree).flatMap(strings);
  return [];
}
const found = (texts: string[], banned: string[]) =>
  banned.filter((b) => texts.some((t) => t.toLowerCase().includes(b.toLowerCase())));

const zhAll = strings(MESSAGES.zh);
const enAll = strings(MESSAGES.en);
const zhLegal = strings(MESSAGES.zh.legal);

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
/** Page and library code that still holds text of its own, outside the message catalogs. */
const sourceTexts = ['app', 'components', 'lib'].flatMap((dir) =>
  readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => readFileSync(join(ROOT, dir, file), 'utf8')),
);
const enLegal = strings(MESSAGES.en.legal);

describe('no fatalism, verdict-seeking examples or contradictions', () => {
  it('in Chinese', () => {
    expect(found(zhAll, [
      '命中注定', '吉凶等级', '结婚运最好', '两人结婚是否合适', '今年适合换工作', '感情关键期', '感情匹配度如何',
      '四化飞星', '飞星（四化）', '以四化为纲', '四化才是命运的手',
    ])).toEqual([]);
  });

  it('in English', () => {
    expect(found(enAll, [
      'what they say about your destiny', 'sorted from auspicious', 'best time for me to marry', 'change jobs this year',
      'good year to change jobs', 'right for marriage', 'matter most for us', 'match in love',
      'flying star', 'guiding thread', 'hand of fate',
    ])).toEqual([]);
  });
});

describe('one name for everything', () => {
  it('uses one brand name, including og:site_name', () => {
    expect(MESSAGES.zh.meta.siteName).toBe('紫微命盘');
    expect(MESSAGES.en.meta.siteName).toBe('Ziwei Natal Chart');
    expect(found(zhAll, ['紫微研究'])).toEqual([]);
    expect(found(enAll, ['Ziwei Research'])).toEqual([]);
    // Pages that are still Chinese-only keep their text in code, so the old name is checked there too.
    expect(found(sourceTexts, ['紫微研究'])).toEqual([]);
  });

  it('says 起盘 for building a chart; 排盘 stays only inside the method and engine nouns', () => {
    const verbs = zhAll
      .map((text) => text.replace(/排盘(体系|法|引擎)/g, ''))
      .filter((text) => text.includes('排盘'));
    expect(verbs).toEqual([]);
  });

  it('never counts thirteen palaces, and calls the chart page by its one name', () => {
    expect(found(zhAll, ['13 宫位', '13 个宫位', '「排盘」页'])).toEqual([]);
    expect(found(enAll, ['13 palaces'])).toEqual([]);
  });

  it('gives /chart and /heming their own page titles', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(MESSAGES[locale].chart.meta.title).not.toBe(MESSAGES[locale].meta.title);
      expect(MESSAGES[locale].heming.meta.title).not.toBe(MESSAGES[locale].meta.title);
      expect(MESSAGES[locale].chart.meta.description.trim()).not.toBe('');
      expect(MESSAGES[locale].heming.meta.description.trim()).not.toBe('');
    }
  });
});

describe('legal pages describe the real product', () => {
  it('in Chinese: no penalty threats, raw markdown, or features that do not exist', () => {
    expect(found(zhLegal, [
      '100 万', '公安机关', '指纹', '**', '手机号', '支付宝', '微信支付', '短信', '会员', '准 / 不准', '暗黑', '均为本平台原创',
    ])).toEqual([]);
  });

  it('in English', () => {
    expect(found(enLegal, [
      '1 million', 'police', 'watermark', '**', 'phone number', 'SMS', 'Alipay', 'WeChat Pay', 'membership',
      'accurate / inaccurate', 'dark/light',
    ])).toEqual([]);
  });

  it('says what reaches the AI service, and names the preferences and analytics it stores', () => {
    for (const locale of ['zh', 'en'] as const) {
      const text = strings(MESSAGES[locale].legal.privacy).join(' ');
      expect(text).toMatch(/Anthropic/);
      expect(text).toMatch(/NEXT_LOCALE/);
      expect(text).toMatch(/Vercel/);
    }
  });
});

describe('classics: summaries are labelled as summaries, and two errors are fixed', () => {
  it('labels the passages as modern summaries in both languages', () => {
    expect(MESSAGES.zh.library.summaryNotice).toMatch(/今人整理/);
    expect(MESSAGES.en.library.summaryNotice).toMatch(/summar/i);
    expect(found(strings(MESSAGES.zh.library), ['段原文', '古籍原文匹配', '权威古籍全文检索'])).toEqual([]);
    expect(found(strings(MESSAGES.en.library), ['of original text'])).toEqual([]);
  });

  it('places Ziwei by the Five Phases Configuration and the lunar day, not by the year stem', () => {
    const text = ALL_BOOKS.flatMap((b) => b.chapters.flatMap((c) => c.paragraphs.map((p) => p.text))).join('\n');
    expect(text).not.toContain('先以年干起紫微');
    expect(PARAGRAPH_EN['qj-1-2']).not.toMatch(/year’s tiangan to place Ziwei/);
    expect(PARAGRAPH_EN['qj-1-2']).toMatch(/wuxingju/);
  });

  it('does not claim the life is fixed once the Life Palace is set', () => {
    const text = ALL_BOOKS.flatMap((b) => b.chapters.flatMap((c) => c.paragraphs.map((p) => p.text))).join('\n');
    expect(text).not.toContain('命宫定，则一生格局定');
    expect(PARAGRAPH_EN['qs-1-1']).not.toMatch(/whole life is fixed/);
  });

  it('does not group the Quanji chapters into a Southern and Northern Dipper the star lists do not match', () => {
    const quanji = ALL_BOOKS.find((b) => b.slug === 'quanji')!;
    expect(quanji.chapters.map((c) => c.title).filter((t) => /南斗|北斗/.test(t))).toEqual([]);
  });
});

describe('AI tone guardrails', () => {
  it('asks for reasons, not yes/no verdicts, and bans hype words, in both prompts', () => {
    expect(systemPrompt('zh')).toMatch(/是或否/);
    expect(systemPrompt('zh')).toMatch(/正宗/);
    expect(systemPrompt('zh')).toMatch(/注定/);
    expect(systemPrompt('en')).toMatch(/yes\/no/);
    expect(systemPrompt('en')).toMatch(/destined/);
  });
});
