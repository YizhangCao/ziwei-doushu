/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Shared steps of the admin API routes: the admin check, reading the
 * JSON body, and turning admin errors into `{ error }` responses.
 */

import { AuthError, requireRole } from '@/lib/auth/guards';
import { toSessionUser } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/types';
import { AdminError } from './users';

/** The part of an Auth.js-wrapped request that carries the session. */
interface SessionRequest {
  auth: { user?: { id?: string; role?: unknown } } | null;
}

/** Returns the signed-in admin, or the 401 / 403 response to send instead. */
export function adminOrResponse(request: SessionRequest): SessionUser | Response {
  try {
    return requireRole(toSessionUser({ sub: request.auth?.user?.id, role: request.auth?.user?.role }), 'admin');
  } catch (error) {
    if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

/** Reads the JSON body; invalid JSON gives `undefined`, which the zod schemas reject as 400. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Maps an AdminError to its `{ error }` response; anything else is rethrown (500). */
export function adminErrorResponse(error: unknown): Response {
  if (error instanceof AdminError) return Response.json({ error: error.message }, { status: error.status });
  throw error;
}
