/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Who may open which member page; the proxy acts on the answer. */

import type { SessionUser } from './types';

export type PageAccess = 'allow' | 'login' | 'forbidden';

/**
 * Decides access to a member page: guests go to login, and only admins enter the
 * admin area. Pages still check the session themselves; this only lets the proxy
 * answer early, with a real 403 status.
 */
export function pageAccess(pathname: string, user: SessionUser | null): PageAccess {
  if (!user) return 'login';
  const adminArea = pathname === '/admin' || pathname.startsWith('/admin/');
  return adminArea && user.role !== 'admin' ? 'forbidden' : 'allow';
}
