/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The hourly limit's reply comes from the message files (#9, after #59):
 * Chinese word for word, English with plural minutes and hours and no Chinese.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

const HAN = /[㐀-鿿豈-﫿]/;

describe('rate limit text', () => {
  it('keeps the Chinese word for word', () => {
    expect(MESSAGES.zh.insight.errors.rateLimitedMinutes).toBe('AI 解读请求太频繁，请约 {minutes} 分钟后再试。');
    expect(MESSAGES.zh.insight.errors.rateLimitedHours).toBe('AI 解读请求太频繁，请约 {hours} 小时后再试。');
  });

  it('has English with plural units and no Chinese', () => {
    for (const text of [MESSAGES.en.insight.errors.rateLimitedMinutes, MESSAGES.en.insight.errors.rateLimitedHours]) {
      expect(text).toMatch(/plural/);
      expect(HAN.test(text), text).toBe(false);
    }
  });

  it('is not hardcoded in the helper or the reading panel', () => {
    for (const file of ['lib/rate-limit/message.ts', 'components/InsightPanel.tsx']) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('请求太频繁');
    }
  });

  it('documents the rate limit settings in .env.example in English', () => {
    const lines = readFileSync('.env.example', 'utf8').split('\n');
    const start = lines.findIndex((l) => l.includes('#9'));
    const end = lines.findIndex((l) => l.startsWith('REDIS_URL='));
    expect(start).toBeGreaterThanOrEqual(0);
    expect(lines.slice(start, end + 1).filter((l) => HAN.test(l))).toEqual([]);
  });
});
