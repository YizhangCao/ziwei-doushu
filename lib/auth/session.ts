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
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
}

/**
 * Called once per GitHub sign-in: finds the User by email or creates one. New users get the
 * schema default role (member). An existing user's role is never touched here; only an admin
 * changes roles (#23).
 */
export async function upsertUserFromProfile(db: Pick<PrismaClient, 'user'>, profile: GitHubProfile): Promise<SessionUser> {
  const email = profile.email?.trim().toLowerCase();
  if (!email) throw new Error('GitHub account has no email address');

  const details = { name: profile.name ?? null, image: profile.image ?? null };
  const user = await db.user.upsert({
    where: { email },
    update: details,
    create: { email, ...details },
    select: { id: true, role: true },
  });
  return { id: user.id, role: user.role };
}
