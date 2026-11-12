/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview User search and role changes for the admin area. */

import type { PrismaClient } from '@/lib/generated/prisma/client';
import type { Role, SessionUser } from '@/lib/auth/types';

/** A user as the admin area shows it. */
export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string | null;
  githubId: string | null;
  role: Role;
  createdAt: Date;
}

/** Thrown for a request that is understood but cannot be done; the route maps `status`. */
export class AdminError extends Error {
  readonly status: 400 | 404;

  constructor(status: 400 | 404, message: string) {
    super(message);
    this.name = 'AdminError';
    this.status = status;
  }
}

const SELECT = { id: true, name: true, email: true, githubId: true, role: true, createdAt: true } as const;
const PAGE_SIZE = 50;

/**
 * Finds users whose name, email or GitHub id contains `query`, ignoring case,
 * newest first. An empty query lists the newest users.
 */
export async function searchUsers(db: Pick<PrismaClient, 'user'>, query: string): Promise<AdminUserRow[]> {
  const contains = { contains: query, mode: 'insensitive' as const };
  return db.user.findMany({
    where: query ? { OR: [{ name: contains }, { email: contains }, { githubId: contains }] } : undefined,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    select: SELECT,
  });
}

/**
 * Sets another user's role. The change reaches that user's live session within
 * ROLE_REFRESH_MS (lib/auth/session.ts).
 *
 * @throws AdminError 400 when admins target themselves, so the last admin cannot
 *     lock everyone out; 404 when the user does not exist.
 */
export async function changeUserRole(
  db: Pick<PrismaClient, 'user'>,
  actor: SessionUser,
  userId: string,
  role: Role,
): Promise<AdminUserRow> {
  if (actor.id === userId) throw new AdminError(400, 'You cannot change your own role');
  try {
    return await db.user.update({ where: { id: userId }, data: { role }, select: SELECT });
  } catch (error) {
    // P2025: no row matched the where clause.
    if ((error as { code?: unknown }).code === 'P2025') throw new AdminError(404, 'User not found');
    throw error;
  }
}
