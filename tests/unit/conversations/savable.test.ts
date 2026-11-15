/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Which of the reading panel's messages get saved (#22): finished exchanges only.
 * The panel's own failure messages, a reply cut off by a dropped connection, and a question
 * still waiting for its answer are never written to a saved conversation.
 */

import { describe, it, expect } from 'vitest';
import { savableMessages } from '@/lib/conversations/savable';

const prompt = { role: 'user' as const, content: 'PROMPT', hidden: true };
const reading = { role: 'assistant' as const, content: 'READING' };
const question = { role: 'user' as const, content: 'QUESTION' };
const answer = { role: 'assistant' as const, content: 'ANSWER' };
const failure = { role: 'assistant' as const, content: 'The reading didn’t finish.', error: 'failed' };

describe('savableMessages (#22)', () => {
  it('keeps finished exchanges in order, with hidden prompts marked', () => {
    expect(savableMessages([prompt, reading, question, answer])).toEqual([
      { role: 'user', content: 'PROMPT', hidden: true },
      { role: 'assistant', content: 'READING', hidden: false },
      { role: 'user', content: 'QUESTION', hidden: false },
      { role: 'assistant', content: 'ANSWER', hidden: false },
    ]);
  });

  it('leaves out failure messages and the question they answered', () => {
    expect(savableMessages([prompt, reading, question, failure])).toEqual([
      { role: 'user', content: 'PROMPT', hidden: true },
      { role: 'assistant', content: 'READING', hidden: false },
    ]);
  });

  it('leaves out a reply that a dropped connection cut off', () => {
    const cutOff = { role: 'assistant' as const, content: 'Half a rea' };
    expect(savableMessages([prompt, reading, question, cutOff, { ...failure, error: 'network' }])).toHaveLength(2);
  });

  it('holds back a question that is still waiting, and an empty reply that is still streaming', () => {
    expect(savableMessages([prompt, reading, question])).toHaveLength(2);
    expect(savableMessages([prompt, reading, question, { role: 'assistant', content: '' }])).toHaveLength(2);
  });

  it('keeps an earlier unanswered question once a later one is answered: it was part of the talk', () => {
    expect(savableMessages([prompt, reading, question, failure, { role: 'user', content: 'AGAIN' }, answer]).map((m) => m.content)).toEqual([
      'PROMPT', 'READING', 'QUESTION', 'AGAIN', 'ANSWER',
    ]);
  });

  it('saves nothing before the first reply has finished', () => {
    expect(savableMessages([])).toEqual([]);
    expect(savableMessages([prompt])).toEqual([]);
  });
});
