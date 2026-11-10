// Minimal auth shapes for role and permission checks (#17).
// The database (#14) isn't ready yet, so callers pass these in as plain data.
// When Prisma lands, map its rows onto these shapes instead of changing the checks.

/** Signed-in roles. A guest is "no session": `SessionUser | null` with null. */
export type Role = 'member' | 'practitioner' | 'admin';

/** The user from the server session. Never built from a client-sent id. */
export interface SessionUser {
  id: string;
  role: Role;
}

/** Only the fields an access check needs; birth data never enters auth code. */
export interface ChartRecord {
  id: string;
  ownerId: string;
}

/** A member sharing one chart with one practitioner. Revoking sets revokedAt. */
export interface ChartShare {
  chartId: string;
  practitionerId: string;
  revokedAt: Date | null;
}

/** Every action in the AGENTS.md "Roles and authorization" table. */
export type Action =
  // Guest
  | 'chart:build'
  | 'api-docs:read'
  // Member
  | 'chart:save'
  | 'chart:rename'
  | 'chart:delete'
  | 'reading:create'
  | 'conversation:save'
  | 'heming:create'
  | 'chart:share'
  | 'reading:report'
  // Practitioner
  | 'shared-chart:view'
  | 'palace-note:create'
  | 'consultation:reply'
  // Admin
  | 'user:manage'
  | 'report:review'
  | 'ai-limit:set'
  | 'api-key:revoke';

/** HTTP status a failed check maps to (AGENTS.md "Security"). */
export type AuthErrorStatus = 401 | 403 | 404;
