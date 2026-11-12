/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Book, chapter and passage text for the visitor's language (#59). Chinese
 * returns the original data untouched; English returns lib/classics/en.ts. The original
 * passage is always shown, so only its English rendering ("which means") is optional.
 */

import type { Locale } from '@/lib/i18n/locale';
import type { Book } from './types';
import { BOOK_EN, CHAPTER_EN, COUPLET_IDS, PARAGRAPH_EN, chapterKey } from './en';

export interface BookLabels {
  title: string;
  dynasty: string;
  /** Full author line. */
  author: string;
  /** First name only, for compact cards (the Chinese data appends notes after a space). */
  authorShort: string;
  intro: string;
}

export function bookLabels(book: Book, locale: Locale): BookLabels {
  const en = locale === 'en' ? BOOK_EN[book.slug] : undefined;
  if (!en) {
    return { title: book.title, dynasty: book.dynasty, author: book.author, authorShort: book.author.split(' ')[0], intro: book.intro };
  }
  return { title: en.title, dynasty: en.dynasty, author: en.author, authorShort: en.author, intro: en.intro };
}

export function chapterLabels(book: Book, index: number, locale: Locale): { title: string; subtitle?: string } {
  const chapter = book.chapters[index];
  const en = locale === 'en' ? CHAPTER_EN[chapterKey(book.slug, index)] : undefined;
  return en ? { title: en.title, subtitle: en.subtitle } : { title: chapter.title, subtitle: chapter.subtitle };
}

/** The English rendering of a passage, shown after the original as "which means"; none in Chinese. */
export function passageMeaning(paragraphId: string, locale: Locale): { text: string; couplet: boolean } | undefined {
  if (locale !== 'en') return undefined;
  const text = PARAGRAPH_EN[paragraphId];
  return text ? { text, couplet: COUPLET_IDS.has(paragraphId) } : undefined;
}
