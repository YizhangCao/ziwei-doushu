import type { Action, ChartRecord, ChartShare, Role, SessionUser } from './types';

const GUEST_ACTIONS: readonly Action[] = ['chart:build', 'api-docs:read'];
const MEMBER_ACTIONS: readonly Action[] = [
  'chart:save', 'chart:rename', 'chart:delete', 'reading:create',
  'conversation:save', 'heming:create', 'chart:share', 'reading:report',
];
const PRACTITIONER_ACTIONS: readonly Action[] = ['shared-chart:view', 'palace-note:create', 'consultation:reply'];
const ADMIN_ACTIONS: readonly Action[] = ['user:manage', 'report:review', 'ai-limit:set', 'api-key:revoke'];

// AGENTS.md "Roles and authorization". Admin gets member actions but not practitioner ones,
// so being an admin never grants a view of other people's shared charts.
const ROLE_ACTIONS: Record<Role, ReadonlySet<Action>> = {
  member: new Set([...GUEST_ACTIONS, ...MEMBER_ACTIONS]),
  practitioner: new Set([...GUEST_ACTIONS, ...MEMBER_ACTIONS, ...PRACTITIONER_ACTIONS]),
  admin: new Set([...GUEST_ACTIONS, ...MEMBER_ACTIONS, ...ADMIN_ACTIONS]),
};

/** Role-level check: may this user (null = guest) do this kind of action at all? */
export function can(user: SessionUser | null, action: Action): boolean {
  if (!user) return GUEST_ACTIONS.includes(action);
  return ROLE_ACTIONS[user.role].has(action);
}

/** Owner, or a current practitioner with an active (unrevoked) share of this chart. */
export function canViewChart(user: SessionUser | null, chart: ChartRecord, shares: readonly ChartShare[]): boolean {
  if (!user) return false;
  if (chart.ownerId === user.id) return true;
  if (user.role !== 'practitioner') return false;
  return shares.some((s) => s.chartId === chart.id && s.practitionerId === user.id && s.revokedAt === null);
}

/** Rename/delete: owner only. A share grants view access, never edit access. */
export function canModifyChart(user: SessionUser | null, chart: ChartRecord): boolean {
  return user !== null && chart.ownerId === user.id;
}
