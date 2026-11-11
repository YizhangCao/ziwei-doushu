/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Unit tests for `toSessionUser`: valid tokens map to a
 * `SessionUser`, and anything malformed maps to no session.
 */

import { describe, it, expect } from 'vitest';
import { toSessionUser } from '@/lib/auth/session';

describe('toSessionUser(token)', () => {
  it('maps sub and role to a SessionUser', () => {
    expect(toSessionUser({ sub: 'user-1', role: 'member' })).toEqual({ id: 'user-1', role: 'member' });
    expect(toSessionUser({ sub: 'user-2', role: 'practitioner' })).toEqual({ id: 'user-2', role: 'practitioner' });
    expect(toSessionUser({ sub: 'user-3', role: 'admin' })).toEqual({ id: 'user-3', role: 'admin' });
  });

  it('ignores extra token fields', () => {
    expect(toSessionUser({ sub: 'user-1', role: 'member', name: 'Demo', email: 'demo@example.test' }))
      .toEqual({ id: 'user-1', role: 'member' });
  });

  it('returns null for no token', () => {
    expect(toSessionUser(null)).toBeNull();
    expect(toSessionUser(undefined)).toBeNull();
  });

  it('returns null when sub is missing or empty', () => {
    expect(toSessionUser({ role: 'member' })).toBeNull();
    expect(toSessionUser({ sub: '', role: 'member' })).toBeNull();
  });

  it('returns null for an unknown or missing role', () => {
    expect(toSessionUser({ sub: 'user-1' })).toBeNull();
    expect(toSessionUser({ sub: 'user-1', role: 'superuser' })).toBeNull();
    expect(toSessionUser({ sub: 'user-1', role: 42 })).toBeNull();
  });
});
