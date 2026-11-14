/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The English home hero says the reading is "analyzed by AI" (#70), as the
 * product owner asked on 11/12. The Chinese hero is unchanged.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

const plain = (text: string) => text.replace(/<\/?phrase>/g, '');

describe('home hero subclaim', () => {
  it('says analyzed by AI in English', () => {
    expect(plain(MESSAGES.en.home.hero.subclaim)).toBe('Charted by Ni Haixia’s method, analyzed by AI.');
    expect(JSON.stringify(MESSAGES.en.home)).not.toContain('palace by palace');
  });

  it('keeps the Chinese hero as it is', () => {
    expect(plain(MESSAGES.zh.home.hero.subclaim)).toBe('按倪海厦体系起盘，AI 逐宫解读。');
  });
});
