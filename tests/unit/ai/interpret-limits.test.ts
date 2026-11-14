/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Request limits for /api/interpret, by role (#105). A follow-up sends the model's
 * earlier readings back, and an English reading runs about 5,500 characters, so one 2,000-character
 * cap for every message made each follow-up fail with 400. A visitor still types at most 2,000;
 * the model's own replies may be longer, and the whole conversation has a ceiling.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  MAX_ASSISTANT_CHARS,
  MAX_MESSAGES,
  MAX_TOTAL_CHARS,
  MAX_USER_CHARS,
  fitsInterpretLimits,
  toInterpretHistory,
} from '@/lib/ai/interpret-limits';
import { validateInterpretRequest } from '@/lib/ai/interpret';
import { generateChart } from '@/lib/ziwei/algorithm';

const user = (n: number) => ({ role: 'user' as const, content: '问'.repeat(n) });
const assistant = (n: number) => ({ role: 'assistant' as const, content: 'a'.repeat(n) });

// Synthetic birth data, not a real person.
const chart = generateChart({ year: 1990, month: 6, day: 15, hour: 6, gender: 'female' });

describe('the limits (#105)', () => {
  it('are 30 messages, 2,000 characters typed, 20,000 per reply and 100,000 in all', () => {
    expect([MAX_MESSAGES, MAX_USER_CHARS, MAX_ASSISTANT_CHARS, MAX_TOTAL_CHARS]).toEqual([30, 2000, 20000, 100000]);
  });

  it('live in a module the reading panel can import: no imports, so no server code', () => {
    expect(readFileSync('lib/ai/interpret-limits.ts', 'utf8')).not.toMatch(/^import /m);
  });

  it('are the ones the reading panel checks, with no copy of its own', () => {
    const panel = readFileSync('components/InsightPanel.tsx', 'utf8');
    expect(panel).toContain("from '@/lib/ai/interpret-limits'");
    expect(panel).not.toMatch(/const MAX_(MESSAGES|CHARS)\s*=/);
  });
});

describe('fitsInterpretLimits', () => {
  it('takes a question of 2,000 characters, not 2,001', () => {
    expect(fitsInterpretLimits([user(2000)])).toBe(true);
    expect(fitsInterpretLimits([user(2001)])).toBe(false);
  });

  it('takes a reply of 20,000 characters, not 20,001', () => {
    expect(fitsInterpretLimits([user(1), assistant(20000)])).toBe(true);
    expect(fitsInterpretLimits([user(1), assistant(20001)])).toBe(false);
  });

  it('takes 30 messages, not 31', () => {
    expect(fitsInterpretLimits(Array.from({ length: 30 }, () => user(1)))).toBe(true);
    expect(fitsInterpretLimits(Array.from({ length: 31 }, () => user(1)))).toBe(false);
  });

  it('takes 100,000 characters in all, not 100,001', () => {
    const five = Array.from({ length: 5 }, () => assistant(20000));
    expect(fitsInterpretLimits(five)).toBe(true);
    expect(fitsInterpretLimits([...five, user(1)])).toBe(false);
  });
});

describe('validateInterpretRequest applies the limits by role (#105)', () => {
  it('accepts a follow-up after a 5,500-character reading', () => {
    expect(validateInterpretRequest({ chart, messages: [user(20), assistant(5500), user(10)] })).not.toBeNull();
  });

  it('rejects a reply over 20,000 characters', () => {
    expect(validateInterpretRequest({ chart, messages: [user(20), assistant(20001), user(10)] })).toBeNull();
  });

  it('rejects a conversation over 100,000 characters in all', () => {
    const replies = Array.from({ length: 5 }, () => assistant(20000));
    expect(validateInterpretRequest({ chart, messages: [user(10), ...replies] })).toBeNull();
  });

  it('still rejects a question over 2,000 characters', () => {
    expect(validateInterpretRequest({ chart, messages: [user(2001)] })).toBeNull();
  });
});

describe('toInterpretHistory is what the panel sends back (#105)', () => {
  it('leaves failure messages out, and keeps only role and content', () => {
    const shown = [
      { role: 'user' as const, content: 'q1', hidden: true },
      { role: 'assistant' as const, content: 'reading' },
      { role: 'user' as const, content: 'q2' },
      { role: 'assistant' as const, content: '解读没有完成，请稍后重试。', error: 'failed' },
    ];
    expect(toInterpretHistory(shown)).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'reading' },
      { role: 'user', content: 'q2' },
    ]);
  });

  it('clips a reply over 20,000 characters, so the next question still fits', () => {
    expect(toInterpretHistory([user(1), assistant(20005)])[1].content).toHaveLength(MAX_ASSISTANT_CHARS);
  });
});
