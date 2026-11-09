import { canViewChart } from './permissions';
import type { AuthErrorStatus, ChartRecord, ChartShare, Role, SessionUser } from './types';

/** Thrown by the guards; a route handler turns it into `{ error }` with this status. */
export class AuthError extends Error {
  readonly status: AuthErrorStatus;

  constructor(status: AuthErrorStatus, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/** 401 unless signed in. */
export function requireUser(user: SessionUser | null): SessionUser {
  if (!user) throw new AuthError(401, 'Not signed in');
  return user;
}

// Which signed-in roles satisfy each required role. Practitioner includes member;
// admin includes member but not practitioner (see permissions.ts).
const SATISFIES: Record<Role, readonly Role[]> = {
  member: ['member', 'practitioner', 'admin'],
  practitioner: ['practitioner'],
  admin: ['admin'],
};

/** 401 if not signed in, 403 if signed in without the role. */
export function requireRole(user: SessionUser | null, role: Role): SessionUser {
  const signedIn = requireUser(user);
  if (!SATISFIES[role].includes(signedIn.role)) throw new AuthError(403, 'Forbidden');
  return signedIn;
}

/**
 * 401 if not signed in; 404 if the chart is missing OR not theirs, with the same
 * message, so a response never reveals that someone else's chart exists.
 */
export function requireChartAccess(
  user: SessionUser | null,
  chart: ChartRecord | null,
  shares: readonly ChartShare[],
): ChartRecord {
  const signedIn = requireUser(user);
  if (!chart || !canViewChart(signedIn, chart, shares)) throw new AuthError(404, 'Chart not found');
  return chart;
}
