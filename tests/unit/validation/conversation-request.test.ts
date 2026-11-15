/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview What may be appended to a saved chart's conversation (#22). The limits match what
 * /api/interpret accepts, so a saved conversation can always be sent back as history: 30 messages,
 * 2,000 characters for what the visitor types, 20,000 for one of the model's replies.
 */

import { describe, it, expect } from 'vitest';
import { MAX_CONVERSATION_MESSAGES, appendConversationBodySchema } from '@/lib/validation/conversation-request';

const parse = (messages: unknown) => appendConversationBodySchema.safeParse({ messages });
const user = (n: number, hidden?: boolean) => ({ role: 'user', content: '问'.repeat(n), ...(hidden === undefined ? {} : { hidden }) });
const assistant = (n: number) => ({ role: 'assistant', content: 'a'.repeat(n) });

describe('appendConversationBodySchema (#22)', () => {
  it('accepts an exchange: a hidden reading prompt and a 5,500-character reply', () => {
    const result = parse([user(300, true), assistant(5500)]);
    expect(result.success).toBe(true);
    expect(result.data?.messages[0]).toEqual({ role: 'user', content: '问'.repeat(300), hidden: true });
  });

  it('treats a message without hidden as shown', () => {
    expect(parse([user(10)]).data?.messages[0].hidden).toBe(false);
  });

  it('caps a conversation at 30 messages', () => {
    expect(MAX_CONVERSATION_MESSAGES).toBe(30);
    expect(parse(Array.from({ length: 30 }, () => user(1))).success).toBe(true);
    expect(parse(Array.from({ length: 31 }, () => user(1))).success).toBe(false);
  });

  it('takes 2,000 characters typed and 20,000 per reply, no more', () => {
    expect(parse([user(2000), assistant(20000)]).success).toBe(true);
    expect(parse([user(2001)]).success).toBe(false);
    expect(parse([user(1), assistant(20001)]).success).toBe(false);
  });

  it.each([
    ['no messages', []],
    ['a system message', [{ role: 'system', content: 'x' }]],
    ['an empty message', [{ role: 'user', content: '' }]],
    ['hidden that is not true or false', [{ role: 'user', content: 'x', hidden: 'yes' }]],
    ['a message that is not an object', ['x']],
  ])('rejects %s', (_name, messages) => {
    expect(parse(messages).success).toBe(false);
  });

  it('rejects a body without a messages list', () => {
    expect(appendConversationBodySchema.safeParse({}).success).toBe(false);
    expect(appendConversationBodySchema.safeParse(null).success).toBe(false);
  });
});
