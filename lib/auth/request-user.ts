import { toSessionUser } from './session';
import type { SessionUser } from './types';

/** The `auth` field Auth.js puts on a request wrapped in auth(). */
export interface RequestAuth {
  user?: { id?: unknown; role?: unknown } | null;
}

/** The signed-in user from the Auth.js session on a request, or null for a guest. */
export function requestUser(auth: RequestAuth | null | undefined): SessionUser | null {
  return toSessionUser({ sub: auth?.user?.id, role: auth?.user?.role });
}
