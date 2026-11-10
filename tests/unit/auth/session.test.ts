import { describe, it, expect } from 'vitest';
import { toSessionUser } from '@/lib/auth/session';

// toSessionUser(token) turns the decoded Auth.js JWT into the SessionUser that the
// guards in lib/auth/guards.ts take. Anything malformed is treated as "no session".
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
