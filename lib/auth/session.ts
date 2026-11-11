/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.2
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Maps Auth.js tokens to session users, and resolves GitHub sign-ins
 * to User rows.
 */

import type { PrismaClient } from '@/lib/generated/prisma/client';
import type { Role, SessionUser } from './types';

// Every Role value. A role missing here would make toSessionUser reject its tokens.
const ROLES: readonly Role[] = ['member', 'practitioner', 'admin'];

const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);

/**
 * Converts a decoded Auth.js JWT, or the session built from it, into the
 * `SessionUser` that the auth guards accept.
 *
 * @return The user, or null if the token is missing, has no `sub`, or has an
 *     unknown role, so a malformed token never grants access.
 */
export function toSessionUser(token: { sub?: unknown; role?: unknown; [key: string]: unknown } | null | undefined): SessionUser | null {
  if (!token || typeof token.sub !== 'string' || token.sub === '' || !isRole(token.role)) return null;
  return { id: token.sub, role: token.role };
}

/** The parts of a GitHub sign-in that are stored on the User row. */
export interface GitHubProfile {
  /** GitHub's numeric account id as a string (Auth.js `account.providerAccountId`). */
  githubId: string | null | undefined;
  /** Null or undefined when GitHub does not share the user's email. */
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
}

/**
 * Finds or creates the User row for a GitHub sign-in and returns its id and role.
 *
 * Users are matched by GitHub account id, never by email: GitHub may withhold the
 * email and users can change it, and matching by email would let another GitHub
 * account with the same address take over an existing row.
 *
 * - Existing user: refreshes name and image only. Role is never changed here
 *   (admins manage roles), and neither is email, so a later sign-in cannot
 *   collide with the unique email index.
 * - New user: gets the schema default role, `member`. Email is stored only if
 *   GitHub provides one that no other row already uses.
 *
 * @throws Error if the profile has no GitHub account id.
 */
export async function upsertUserFromProfile(db: Pick<PrismaClient, 'user'>, profile: GitHubProfile): Promise<SessionUser> {
  const githubId = profile.githubId?.trim();
  if (!githubId) throw new Error('GitHub sign-in has no account id');

  const details = { name: profile.name ?? null, image: profile.image ?? null };
  const select = { id: true, role: true } as const;

  const existing = await db.user.findUnique({ where: { githubId }, select: { id: true } });
  if (existing) {
    return db.user.update({ where: { id: existing.id }, data: details, select });
  }

  const email = profile.email?.trim().toLowerCase() || null;
  const emailTaken = email !== null && (await db.user.findUnique({ where: { email }, select: { id: true } })) !== null;
  return db.user.create({ data: { githubId, email: emailTaken ? null : email, ...details }, select });
}
