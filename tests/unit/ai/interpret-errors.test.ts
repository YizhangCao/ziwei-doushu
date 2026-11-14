/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 13, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Unit tests for telling a final /api/interpret 500 from one a retry may get
 * past (#118). Only a missing AI setup is final; an Anthropic outage or a database timeout
 * also answers 500, and the reading panel keeps its retry for those.
 */

import { describe, it, expect } from 'vitest';
import { AI_NOT_CONFIGURED, isAiNotConfigured } from '@/lib/ai/interpret-errors';

describe('isAiNotConfigured(body)', () => {
  it('is true for the body the route sends when the AI is not set up', () => {
    expect(AI_NOT_CONFIGURED).toBe('AI service is not configured');
    expect(isAiNotConfigured({ error: AI_NOT_CONFIGURED })).toBe(true);
  });

  it('is false for every other 500 body, which a retry may get past', () => {
    for (const body of [{ error: 'AI service request failed' }, { error: 'failed' }, { error: 1 }, null, undefined, '<html>']) {
      expect(isAiNotConfigured(body)).toBe(false);
    }
  });
});
