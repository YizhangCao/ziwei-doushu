/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Unit tests for `pageAccess`, which the proxy uses to send guests to
 * /login and to answer 403 for signed-in users without the page's role.
 */

import { describe, it, expect } from 'vitest';
import { pageAccess } from '@/lib/auth/page-access';

const member = { id: 'u1', role: 'member' } as const;
const practitioner = { id: 'u2', role: 'practitioner' } as const;
const admin = { id: 'u3', role: 'admin' } as const;

describe('pageAccess(pathname, user)', () => {
  it('sends guests to login on every member page', () => {
    for (const path of ['/charts', '/consultations/abc', '/admin']) expect(pageAccess(path, null)).toBe('login');
  });

  it('lets any signed-in user into /charts and /consultations', () => {
    expect(pageAccess('/charts', member)).toBe('allow');
    expect(pageAccess('/consultations/abc', practitioner)).toBe('allow');
  });

  it('lets only admins into /admin and its subpages', () => {
    expect(pageAccess('/admin', admin)).toBe('allow');
    expect(pageAccess('/admin/users', admin)).toBe('allow');
    expect(pageAccess('/admin', member)).toBe('forbidden');
    expect(pageAccess('/admin/users', practitioner)).toBe('forbidden');
  });

  it('does not treat a path that only starts with "admin" as the admin area', () => {
    expect(pageAccess('/administrator', member)).toBe('allow');
  });
});
