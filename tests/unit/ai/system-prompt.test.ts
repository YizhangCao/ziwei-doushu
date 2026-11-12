/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The reading's language follows the locale (#59). The Chinese system
 * prompt is exactly today's. The English one carries the product owner's translation
 * rules and the fixed glossary. Neither ever contains chart data (#4).
 */

import { describe, it, expect } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { createAnthropicStream, systemPrompt, type InterpretRequest } from '@/lib/ai/interpret';
import { generateChart } from '@/lib/ziwei/algorithm';

// Synthetic birth data, not a real person.
const request = (): InterpretRequest => ({
  chart: generateChart({ year: 1990, month: 6, day: 15, hour: 6, gender: 'female' }),
  messages: [{ role: 'user', content: 'Read my chart' }],
});

type CreateParams = Parameters<Anthropic['messages']['create']>[0];
function sentSystem(locale?: 'zh' | 'en'): unknown {
  let sent: CreateParams | undefined;
  const client = { messages: { create: (params: CreateParams) => { sent = params; return {}; } } };
  void createAnthropicStream(client as unknown as Pick<Anthropic, 'messages'>, request(), 'test-model', locale);
  return sent?.system;
}

describe('systemPrompt', () => {
  it('keeps the original Chinese instructions first (the tone guardrails of #63 follow them)', () => {
    expect(systemPrompt('zh').startsWith(
      '你是专业的紫微斗数命盘解读助手。命盘数据在用户的第一条消息里。请根据命盘结构，用清晰、谨慎、具体的中文回答用户。不要声称预测必然发生，也不要编造命盘中没有的信息。',
    )).toBe(true);
  });

  it('asks for direct, high-school-level English in the English prompt', () => {
    const en = systemPrompt('en');
    expect(en).toMatch(/English/);
    expect(en).toMatch(/high-school/);
  });

  it('carries the quote, couplet and section-header rules', () => {
    const en = systemPrompt('en');
    expect(en).toContain('which means: "');
    expect(en).toMatch(/rhyming couplet/i);
    expect(en).toContain('**【');
  });

  it('carries the approved glossary', () => {
    const en = systemPrompt('en');
    for (const line of ['命宫 = Life Palace', '贪狼 = Tanlang (Greedy Wolf)', '三方四正 = sanfang sizheng (the trine and opposition palaces)', '大限 = Decade', '五行 = Five Phases']) {
      expect(en).toContain(line);
    }
  });

  it('is fixed per locale, with no chart data in it', () => {
    const chart = request().chart;
    expect(systemPrompt('en')).toBe(systemPrompt('en'));
    expect(systemPrompt('en')).not.toContain(JSON.stringify(chart.palaces[0]));
    expect(systemPrompt('en')).not.toContain('"palaces"');
  });
});

describe('createAnthropicStream picks the prompt for the locale', () => {
  it('sends the English prompt for en and the Chinese prompt by default', () => {
    expect(sentSystem('en')).toBe(systemPrompt('en'));
    expect(sentSystem('zh')).toBe(systemPrompt('zh'));
    expect(sentSystem()).toBe(systemPrompt('zh'));
  });
});
