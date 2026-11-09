import { describe, it, expect } from 'vitest';
import { AuthError, requireUser, requireRole, requireChartAccess } from '@/lib/auth/guards';
import type { AuthErrorStatus, ChartRecord, ChartShare, SessionUser } from '@/lib/auth/types';

// Runs fn and returns the HTTP status of the AuthError it throws.
function statusOf(fn: () => unknown): AuthErrorStatus {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(AuthError);
    return (err as AuthError).status;
  }
  throw new Error('expected an AuthError, but nothing was thrown');
}

const member: SessionUser = { id: 'member-1', role: 'member' };
const practitioner: SessionUser = { id: 'prac-1', role: 'practitioner' };
const admin: SessionUser = { id: 'admin-1', role: 'admin' };
const otherMember: SessionUser = { id: 'member-2', role: 'member' };
const chart: ChartRecord = { id: 'chart-1', ownerId: member.id };
const share: ChartShare = { chartId: chart.id, practitionerId: practitioner.id, revokedAt: null };

describe('requireUser(user) — 401 when not logged in', () => {
  it('returns the signed-in user', () => {
    expect(requireUser(member)).toBe(member);
  });

  it('throws 401 for a guest', () => {
    expect(statusOf(() => requireUser(null))).toBe(401);
  });
});

describe('requireRole(user, role) — 401 for guests, 403 for the wrong role', () => {
  it('throws 401 for a guest, before checking the role', () => {
    expect(statusOf(() => requireRole(null, 'member'))).toBe(401);
    expect(statusOf(() => requireRole(null, 'admin'))).toBe(401);
  });

  it('accepts every signed-in role for "member"', () => {
    expect(requireRole(member, 'member')).toBe(member);
    expect(requireRole(practitioner, 'member')).toBe(practitioner);
    expect(requireRole(admin, 'member')).toBe(admin);
  });

  it('accepts only practitioners for "practitioner"', () => {
    expect(requireRole(practitioner, 'practitioner')).toBe(practitioner);
    expect(statusOf(() => requireRole(member, 'practitioner'))).toBe(403);
    expect(statusOf(() => requireRole(admin, 'practitioner'))).toBe(403);
  });

  it('accepts only admins for "admin"', () => {
    expect(requireRole(admin, 'admin')).toBe(admin);
    expect(statusOf(() => requireRole(member, 'admin'))).toBe(403);
    expect(statusOf(() => requireRole(practitioner, 'admin'))).toBe(403);
  });
});

describe('requireChartAccess(user, chart, shares) — 404 hides charts that are not theirs', () => {
  it('returns the chart to its owner', () => {
    expect(requireChartAccess(member, chart, [])).toBe(chart);
  });

  it('returns the chart to a practitioner it is shared with', () => {
    expect(requireChartAccess(practitioner, chart, [share])).toBe(chart);
  });

  it('throws 401 for a guest', () => {
    expect(statusOf(() => requireChartAccess(null, chart, [share]))).toBe(401);
  });

  it('throws 404, not 403, for a chart that is not theirs', () => {
    expect(statusOf(() => requireChartAccess(otherMember, chart, [share]))).toBe(404);
    expect(statusOf(() => requireChartAccess(admin, chart, [share]))).toBe(404);
  });

  it('throws 404 after the share is revoked', () => {
    const revoked: ChartShare = { ...share, revokedAt: new Date('2026-11-01T00:00:00Z') };
    expect(statusOf(() => requireChartAccess(practitioner, chart, [revoked]))).toBe(404);
  });

  it('throws the same 404 for a chart that does not exist', () => {
    expect(statusOf(() => requireChartAccess(member, null, []))).toBe(404);
  });
});
