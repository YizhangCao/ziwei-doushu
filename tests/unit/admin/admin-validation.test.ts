/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Unit tests for the zod schemas behind the admin API. */

import { describe, it, expect } from 'vitest';
import { parseDailyLimitUpdate, parseRoleChange, parseUserSearch } from '@/lib/validation/admin';

describe('parseRoleChange(body)', () => {
  it('accepts each role', () => {
    for (const role of ['member', 'practitioner', 'admin'] as const) {
      expect(parseRoleChange({ role })).toEqual({ ok: true, data: { role } });
    }
  });

  it('rejects an unknown role, a missing role and extra fields', () => {
    expect(parseRoleChange({ role: 'owner' }).ok).toBe(false);
    expect(parseRoleChange({}).ok).toBe(false);
    expect(parseRoleChange({ role: 'admin', userId: 'someone-else' }).ok).toBe(false);
    expect(parseRoleChange(null).ok).toBe(false);
  });
});

describe('parseDailyLimitUpdate(body)', () => {
  it('accepts an integer from 0 to 10000', () => {
    expect(parseDailyLimitUpdate({ dailyAiLimit: 0 })).toEqual({ ok: true, data: { dailyAiLimit: 0 } });
    expect(parseDailyLimitUpdate({ dailyAiLimit: 10000 })).toEqual({ ok: true, data: { dailyAiLimit: 10000 } });
  });

  it('rejects negatives, fractions, strings, too-large values and extra fields', () => {
    for (const body of [{ dailyAiLimit: -1 }, { dailyAiLimit: 2.5 }, { dailyAiLimit: '10' }, { dailyAiLimit: 10001 }, { dailyAiLimit: 5, x: 1 }]) {
      expect(parseDailyLimitUpdate(body).ok).toBe(false);
    }
  });

  it('says what is wrong in the error', () => {
    const result = parseDailyLimitUpdate({ dailyAiLimit: -1 });
    expect(result.ok === false && result.error).toMatch(/dailyAiLimit/);
  });
});

describe('parseUserSearch(params)', () => {
  it('trims the query, and treats a missing one as empty', () => {
    expect(parseUserSearch(new URLSearchParams('q=%20Demo%20'))).toEqual({ ok: true, data: { q: 'Demo' } });
    expect(parseUserSearch(new URLSearchParams())).toEqual({ ok: true, data: { q: '' } });
  });

  it('rejects a query longer than 100 characters', () => {
    expect(parseUserSearch(new URLSearchParams(`q=${'a'.repeat(101)}`)).ok).toBe(false);
  });
});
