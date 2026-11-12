/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The unslop copy pass (#90), after the copy rules of the unslop skill
 * (https://github.com/heydamir/unslop, CC BY 4.0, Damir Sokolovsky). The product owner
 * adopted groups B (specific instead of generic copy), E (no English eyebrows on the
 * Chinese page), C (consistency), P (punctuation and placeholders) and L (real details in
 * the legal pages); group A stays as it is. Each rule is pinned in both languages where it
 * applies. AI prompts (insight.prompts) are not UI and are left out.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';
import { CONTACT } from '@/lib/site';

type Tree = Record<string, unknown>;
const zh = MESSAGES.zh as unknown as Record<string, Tree>;
const en = MESSAGES.en as unknown as Record<string, Tree>;

/** The string at a dotted path, or undefined. */
function at(tree: Record<string, Tree>, path: string): string | undefined {
  let node: unknown = tree;
  for (const part of path.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === 'string' ? node : undefined;
}

/** Every UI string in a language as [path, text], without the AI prompts. */
function uiStrings(tree: Record<string, Tree>): [string, string][] {
  const out: [string, string][] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'string') out.push([path, node]);
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) if (k !== 'prompts') walk(v, path ? `${path}.${k}` : k);
  };
  walk(tree, '');
  return out;
}

const offenders = (tree: Record<string, Tree>, test: (text: string) => boolean) =>
  uiStrings(tree).filter(([, text]) => test(text)).map(([path, text]) => `${path}: ${text}`);

// B follows the drafts the product owner approved on 11/12, written after the tone of
// Apple's mainland China site: a short headline with a product noun, the facts in the line below.
describe('B: specific instead of generic copy', () => {
  it('the closing names the product above a headline about the twelve palaces', () => {
    expect(at(zh, 'home.closing.eyebrow')).toBe(at(zh, 'meta.siteName'));
    expect(at(en, 'home.closing.eyebrow')).toBe(at(en, 'meta.siteName'));
    expect(at(zh, 'home.closing.title')).toBe('十二宫，<br></br>一盘看清');
    expect(at(en, 'home.closing.title')).toBe('Twelve palaces.<br></br>One clear chart.');
  });

  it('the closing description lists what the reading covers', () => {
    for (const word of ['十二宫', '命宫', '性格', '事业', '感情', '财运', '健康']) expect(at(zh, 'home.closing.desc')).toContain(word);
    for (const word of ['twelve palaces', 'Life Palace', 'character', 'career', 'love', 'wealth', 'health']) expect(at(en, 'home.closing.desc')).toContain(word);
  });

  it('the AI feature title says you can read it and ask more', () => {
    expect(at(zh, 'home.features.2.title')).toBe('看得懂，\n还能接着问');
    expect(at(en, 'home.features.2.title')).toBe('Easy to read.\nEasy to ask.');
  });

  it('the roadmap title says four courses open month by month', () => {
    expect(at(zh, 'home.roadmap.title')).toBe('四门课，按月开放');
    expect(at(en, 'home.roadmap.title')).toBe('Four courses, one a month');
  });

  it('the third trinity card ends on what you make of your chart', () => {
    expect(at(zh, 'home.trinity.cards.2.desc')).toMatch(/底色天定，成色自修。$/);
    expect(at(en, 'home.trinity.cards.2.desc')).toMatch(/The chart sets the base\. What you make of it is yours\.$/);
  });

  it('drops the hype words from the closing, the AI feature title and the trinity card', () => {
    for (const path of ['home.closing.desc', 'home.features.2.title', 'home.trinity.cards.2.desc']) {
      expect(at(zh, path), path).not.toMatch(/深度|专属|最强/);
      expect(at(en, path), path).not.toMatch(/\bdeep|in depth|strongest/i);
    }
  });
});

describe('E: no eyebrows', () => {
  it('has no roadmap, trinity or compatibility eyebrow, and no "of life" label', () => {
    for (const path of ['home.roadmap.eyebrow', 'home.trinity.eyebrow', 'home.heming.eyebrow', 'home.trinity.ofLife']) {
      expect(at(zh, path), path).toBeUndefined();
      expect(at(en, path), path).toBeUndefined();
    }
  });
});

describe('C: consistency', () => {
  it('C1: calls him Ni Haixia, never by the master or teacher honorifics', () => {
    expect(offenders(zh, (t) => /倪师|倪海厦老师|倪老师/.test(t))).toEqual([]);
  });

  it('C2: uses the informal you', () => {
    expect(offenders(zh, (t) => t.includes('您'))).toEqual([]);
  });

  it('C3: calls the site "this site", not "the Platform"', () => {
    expect(offenders(zh, (t) => t.includes('本平台'))).toEqual([]);
    expect(offenders(en, (t) => /\bPlatform\b/.test(t))).toEqual([]);
  });

  it('C4: the compatibility follow-up matches the reading panel', () => {
    for (const tree of [zh, en]) {
      expect(at(tree, 'heming.send')).toBe(at(tree, 'insight.send'));
      expect(at(tree, 'heming.sending')).toBe(at(tree, 'insight.reading.answer'));
    }
  });

  it('C5: labels the two people without contract-party wording', () => {
    for (const path of ['heming.personA', 'heming.personB']) expect(at(zh, path), path).not.toMatch(/甲方|乙方|—/);
  });

  it('C6: spaces Arabic digits and Latin words from Chinese (dates and lecture parts excepted)', () => {
    const tight = /[0-9A-Za-z][一-鿿]|[一-鿿][0-9A-Za-z]/;
    const plain = (t: string) => t
      .replace(/\{[^}]*\}/g, '')        // ICU arguments
      .replace(/<[^>]+>/g, ' ')         // rich-text tags, like a line break, separate the text
      .replace(/\d+年(\d+月)?(\d+日)?|\d+月\d+日/g, '') // dates keep the Chinese format
      .replace(/\d+[上下]/g, '');        // Tian Ji lecture parts, like 2上
    expect(offenders(zh, (t) => tight.test(plain(t)))).toEqual([]);
    expect(at(zh, 'knowledge.starsHeading')).toBe('14 主星');
  });

  it('C7: the library breadcrumb uses the library name', () => {
    expect(at(zh, 'library.home')).toBe(at(zh, 'library.title'));
    expect(at(en, 'library.home')).toBe(at(en, 'library.title'));
  });
});

describe('P: punctuation and placeholders', () => {
  it('ends captions, subtitles and status lines without a full stop', () => {
    for (const path of ['home.walkthrough.note', 'home.features.3.subtitle', 'knowledge.progress']) {
      expect(at(zh, path), path).not.toMatch(/。$/);
      expect(at(en, path), path).not.toMatch(/\.$/);
    }
  });

  it('ends the hero claim and subclaim without a full stop', () => {
    for (const path of ['home.hero.claim', 'home.hero.subclaim']) {
      expect(at(zh, path), path).not.toMatch(/。(<\/phrase>)?$/);
      expect(at(en, path), path).not.toMatch(/\.(<\/phrase>)?$/);
    }
  });

  it('keeps placeholders short and plain', () => {
    expect(at(zh, 'library.search.placeholder')).toBe('搜索古籍要义');
    expect(at(en, 'library.search.placeholder')).toBe('Search the classics');
    expect(at(zh, 'birthForm.name.placeholder')).toBeUndefined();
    expect(at(en, 'birthForm.name.placeholder')).toBeUndefined();
    expect(at(zh, 'birthForm.place.pickCity')).toBe('城市');
    expect(at(en, 'birthForm.place.pickCity')).toBe('City');
  });

  it('drops the place hint\'s orphan asterisk, and uses corner quotes in the terms', () => {
    expect(at(zh, 'birthForm.place.hint')).not.toMatch(/^\*/);
    expect(at(en, 'birthForm.place.hint')).not.toMatch(/^\*/);
    expect(offenders({ legal: zh.legal }, (t) => t.includes('"'))).toEqual([]);
  });
});

describe('L: real details in the legal pages', () => {
  it('L1: gives the real contact details, from one constant', () => {
    expect(CONTACT).toEqual({ wechat: 'lyk1121762110', email: 'liu.yika@northeastern.edu' });
    for (const tree of [zh, en]) {
      for (const path of ['legal.terms.contact.body', 'library.about']) {
        expect(at(tree, path), path).toContain('{wechat}');
        expect(at(tree, path), path).toContain('{email}');
      }
    }
  });

  it('L2: announces changes on the site, since no email addresses are collected', () => {
    expect(at(zh, 'legal.terms.changes.body')).not.toContain('邮件');
    expect(at(en, 'legal.terms.changes.body')).not.toMatch(/email/i);
  });

  it('L3: does not name an operating entity that does not exist', () => {
    expect(at(zh, 'legal.terms.law.body')).not.toContain('运营主体');
    expect(at(en, 'legal.terms.law.body')).not.toMatch(/operating entity/i);
  });
});
