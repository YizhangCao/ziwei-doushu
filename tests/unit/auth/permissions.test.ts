import { describe, it, expect } from 'vitest';
import { can, canViewChart, canModifyChart } from '@/lib/auth/permissions';
import type { Action, ChartRecord, ChartShare, Role, SessionUser } from '@/lib/auth/types';

// The AGENTS.md "Roles and authorization" table, written out in full so each
// role × action pair is a separate, readable test case.
const GUEST_ACTIONS: Action[] = ['chart:build', 'api-docs:read'];
const MEMBER_ACTIONS: Action[] = [
  'chart:save', 'chart:rename', 'chart:delete', 'reading:create',
  'conversation:save', 'heming:create', 'chart:share', 'reading:report',
];
const PRACTITIONER_ACTIONS: Action[] = ['shared-chart:view', 'palace-note:create', 'consultation:reply'];
const ADMIN_ACTIONS: Action[] = ['user:manage', 'report:review', 'ai-limit:set', 'api-key:revoke'];
const ALL_ACTIONS: Action[] = [...GUEST_ACTIONS, ...MEMBER_ACTIONS, ...PRACTITIONER_ACTIONS, ...ADMIN_ACTIONS];

// Practitioner is "everything a member can, plus". Admin is treated as a member with
// admin tools, but NOT a practitioner: seeing other people's shared charts stays a
// practitioner-only power, so an admin can't read birth charts just by being admin.
const ALLOWED: Record<Role | 'guest', Action[]> = {
  guest: GUEST_ACTIONS,
  member: [...GUEST_ACTIONS, ...MEMBER_ACTIONS],
  practitioner: [...GUEST_ACTIONS, ...MEMBER_ACTIONS, ...PRACTITIONER_ACTIONS],
  admin: [...GUEST_ACTIONS, ...MEMBER_ACTIONS, ...ADMIN_ACTIONS],
};

const userFor = (role: Role | 'guest'): SessionUser | null =>
  role === 'guest' ? null : { id: `user-${role}`, role };

const matrix = (Object.keys(ALLOWED) as (Role | 'guest')[]).flatMap((role) =>
  ALL_ACTIONS.map((action) => ({ role, action, allowed: ALLOWED[role].includes(action) })),
);

describe('can(user, action) — roles table', () => {
  it.each(matrix)('$role → $action: $allowed', ({ role, action, allowed }) => {
    expect(can(userFor(role), action)).toBe(allowed);
  });
});

// Synthetic ids only; no real people or birth data.
const owner: SessionUser = { id: 'owner-1', role: 'member' };
const practitioner: SessionUser = { id: 'prac-1', role: 'practitioner' };
const otherPractitioner: SessionUser = { id: 'prac-2', role: 'practitioner' };
const otherMember: SessionUser = { id: 'member-2', role: 'member' };
const admin: SessionUser = { id: 'admin-1', role: 'admin' };
const chart: ChartRecord = { id: 'chart-1', ownerId: owner.id };
const activeShare: ChartShare = { chartId: chart.id, practitionerId: practitioner.id, revokedAt: null };
const revokedShare: ChartShare = { ...activeShare, revokedAt: new Date('2026-11-01T00:00:00Z') };

describe('canViewChart(user, chart, shares)', () => {
  it('lets the owner view their chart', () => {
    expect(canViewChart(owner, chart, [])).toBe(true);
  });

  it('lets a practitioner view a chart actively shared with them', () => {
    expect(canViewChart(practitioner, chart, [activeShare])).toBe(true);
  });

  it('blocks a practitioner once the share is revoked', () => {
    expect(canViewChart(practitioner, chart, [revokedShare])).toBe(false);
  });

  it('blocks a practitioner the chart was not shared with', () => {
    expect(canViewChart(otherPractitioner, chart, [activeShare])).toBe(false);
  });

  it('ignores a share that belongs to a different chart', () => {
    const shareForOtherChart: ChartShare = { ...activeShare, chartId: 'chart-2' };
    expect(canViewChart(practitioner, chart, [shareForOtherChart])).toBe(false);
  });

  it('blocks a shared user whose role is no longer practitioner', () => {
    const demoted: SessionUser = { id: practitioner.id, role: 'member' };
    expect(canViewChart(demoted, chart, [activeShare])).toBe(false);
  });

  it('blocks another member', () => {
    expect(canViewChart(otherMember, chart, [activeShare])).toBe(false);
  });

  it('blocks an admin who does not own the chart', () => {
    expect(canViewChart(admin, chart, [activeShare])).toBe(false);
  });

  it('blocks a guest', () => {
    expect(canViewChart(null, chart, [activeShare])).toBe(false);
  });
});

describe('canModifyChart(user, chart) — rename/delete own charts only', () => {
  it('lets the owner modify', () => {
    expect(canModifyChart(owner, chart)).toBe(true);
  });

  it('blocks a practitioner even with an active share (view only)', () => {
    expect(canModifyChart(practitioner, chart)).toBe(false);
  });

  it('blocks another member, an admin, and a guest', () => {
    expect(canModifyChart(otherMember, chart)).toBe(false);
    expect(canModifyChart(admin, chart)).toBe(false);
    expect(canModifyChart(null, chart)).toBe(false);
  });
});
