import type { PrismaClient } from '@/lib/generated/prisma/client';
import type { Role, SessionUser } from './types';

const ROLES: readonly Role[] = ['member', 'practitioner', 'admin'];

const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);

/**
 * The decoded Auth.js JWT (or the session built from it) as the SessionUser the guards take.
 * Anything malformed counts as "no session", so a bad token can never grant access.
 */
export function toSessionUser(token: { sub?: unknown; role?: unknown; [key: string]: unknown } | null | undefined): SessionUser | null {
  if (!token || typeof token.sub !== 'string' || token.sub === '' || !isRole(token.role)) return null;
  return { id: token.sub, role: token.role };
}

export interface GitHubProfile {
  /** GitHub's numeric account id as a string (Auth.js `account.providerAccountId`). */
  githubId: string | null | undefined;
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
}

/**
 * Called once per GitHub sign-in. Users are matched by GitHub account id, never by email:
 * GitHub can withhold a private email and users can change it, and matching by email would
 * let a GitHub account with the same address take over an existing row (PR #35 review).
 *
 * - Existing user: refresh name and image only. Role is never touched here (admins change
 *   roles, #23); email isn't either, so a later login can't hit the unique email index.
 * - New user: schema default role (member). Email is stored only if GitHub gave one and no
 *   other row already has it.
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
