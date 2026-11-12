/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview English for the classics library (#59). Every book, chapter and passage
 * has English. A passage is shown as the original followed by `which means: "..."`, so
 * the English itself carries no quotes and no Chinese; technical terms inside it are
 * pinyin. Parallel couplets are rendered as rhyming couplets, two lines each.
 */

import { describe, it, expect } from 'vitest';
import { ALL_BOOKS } from '@/lib/classics';
import { BOOK_EN, CHAPTER_EN, COUPLET_IDS, PARAGRAPH_EN, chapterKey } from '@/lib/classics/en';

const HAN = /[㐀-鿿豈-﫿]/;
const paragraphs = ALL_BOOKS.flatMap((b) => b.chapters.flatMap((c) => c.paragraphs));

describe('classics in English', () => {
  it('give every book a title (pinyin with English in parentheses), author, dynasty and intro', () => {
    for (const book of ALL_BOOKS) {
      const en = BOOK_EN[book.slug];
      expect(en, book.slug).toBeDefined();
      expect(en.title).toMatch(/^[A-Z][A-Za-z' -]+ \(.+\)$/);
      for (const field of [en.title, en.author, en.dynasty, en.intro]) {
        expect(field.trim()).not.toBe('');
        expect(HAN.test(field)).toBe(false);
      }
    }
  });

  it('give every chapter a title, and a subtitle where the original has one', () => {
    for (const book of ALL_BOOKS) {
      book.chapters.forEach((chapter, i) => {
        const en = CHAPTER_EN[chapterKey(book.slug, i)];
        expect(en, chapterKey(book.slug, i)).toBeDefined();
        expect(HAN.test(en.title)).toBe(false);
        if (chapter.subtitle) expect(en.subtitle && !HAN.test(en.subtitle)).toBe(true);
      });
    }
  });

  it('render every passage in English with no Chinese and no surrounding quotes', () => {
    const missing = paragraphs.filter((p) => !PARAGRAPH_EN[p.id]?.trim()).map((p) => p.id);
    expect(missing).toEqual([]);
    const bad = paragraphs.filter((p) => HAN.test(PARAGRAPH_EN[p.id] ?? '') || /^["“]|["”]$/.test(PARAGRAPH_EN[p.id] ?? ''));
    expect(bad.map((p) => p.id)).toEqual([]);
  });

  it('render couplet passages as whole couplets: an even number of non-empty lines', () => {
    const ids = new Set(paragraphs.map((p) => p.id));
    expect(COUPLET_IDS.size).toBeGreaterThan(0);
    for (const id of COUPLET_IDS) {
      expect(ids.has(id), id).toBe(true);
      const lines = PARAGRAPH_EN[id].split('\n');
      expect(lines.length % 2, id).toBe(0);
      expect(lines.every((line) => line.trim() !== ''), id).toBe(true);
    }
  });
});
