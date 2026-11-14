/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.4
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Maps Auth.js tokens to session users, keeps the role in the token
 * current, and resolves GitHub sign-ins to User rows.
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

/** How long the role copied into a session JWT is trusted before it is read again. */
export const ROLE_REFRESH_MS = 5 * 60 * 1000;

/** The Auth.js JWT fields that carry our user. */
export interface RoleToken {
  sub?: unknown;
  role?: unknown;
  /** When the role was last read from the database, in epoch milliseconds. */
  roleCheckedAt?: unknown;
  [key: string]: unknown;
}

/**
 * Re-reads the user's role into the session JWT once the copy is older than
 * `ROLE_REFRESH_MS`. Sessions renew on every request, so without this a role
 * change made by an admin would never reach a user who stays active.
 *
 * Auth.js clears the session cookie when the jwt callback throws, so a failed
 * read keeps the current token and is retried on the next request instead of
 * signing the user out.
 *
 * @param now The current time in epoch milliseconds.
 * @return The token with the current role and check time; the token unchanged if
 *     it was checked recently, has no user id, or the read failed; or null if the
 *     user no longer exists, which makes Auth.js end the session.
 */
export async function refreshTokenRole<T extends RoleToken>(
  db: Pick<PrismaClient, 'user'>,
  token: T,
  now: number,
): Promise<T | null> {
  if (typeof token.sub !== 'string' || token.sub === '') return token;
  if (typeof token.roleCheckedAt === 'number' && now - token.roleCheckedAt < ROLE_REFRESH_MS) return token;

  let row: { role: Role } | null;
  try {
    row = await db.user.findUnique({ where: { id: token.sub }, select: { role: true } });
  } catch {
    return token;
  }
  return row ? { ...token, role: row.role, roleCheckedAt: now } : null;
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
 * Several first sign-ins of one account at once (two tabs, a double-click on the
 * OAuth consent) create one row: see the retry below.
 *
 * @throws Error if the profile has no GitHub account id.
 */
export async function upsertUserFromProfile(db: Pick<PrismaClient, 'user'>, profile: GitHubProfile): Promise<SessionUser> {
  const githubId = profile.githubId?.trim();
  if (!githubId) throw new Error('GitHub sign-in has no account id');

  const details = { name: profile.name ?? null, image: profile.image ?? null };
  const select = { id: true, role: true } as const;
  const email = profile.email?.trim().toLowerCase() || null;

  // The upsert resolves a githubId conflict atomically (INSERT ... ON CONFLICT), but a
  // concurrent first sign-in can still fail first on the unique email index. By the
  // retry the other sign-in has committed the row, so the upsert takes its update path.
  for (let attempt = 1; ; attempt++) {
    const emailTaken = email !== null && (await db.user.findUnique({ where: { email }, select: { id: true } })) !== null;
    try {
      return await db.user.upsert({
        where: { githubId },
        update: details,
        create: { githubId, email: emailTaken ? null : email, ...details },
        select,
      });
    } catch (error) {
      if (attempt >= 2 || !isUniqueViolation(error)) throw error;
    }
  }
}

/** True for Prisma's unique-constraint error (P2002). */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

/** The `jwt` callback arguments that `resolveToken` reads. */
export interface TokenEvent<T extends RoleToken> {
  token: T;
  /** Set only on sign-in: the profile Auth.js built from GitHub. */
  user?: { email?: string | null; name?: string | null; image?: string | null } | null;
  /** Set only on sign-in. */
  account?: { provider: string; providerAccountId: string } | null;
}

/**
 * The Auth.js `jwt` callback. On a GitHub sign-in it resolves the account to our
 * User row and puts our user id, role and check time in the token. On every later
 * read it hands over to `refreshTokenRole`.
 *
 * @param now The current time in epoch milliseconds.
 * @return The token, or null to end the session.
 */
export async function resolveToken<T extends RoleToken>(
  db: Pick<PrismaClient, 'user'>,
  { token, user, account }: TokenEvent<T>,
  now: number,
): Promise<T | null> {
  if (account?.provider === 'github' && user) {
    const dbUser = await upsertUserFromProfile(db, {
      githubId: account.providerAccountId,
      email: user.email,
      name: user.name,
      image: user.image,
    });
    return { ...token, sub: dbUser.id, role: dbUser.role, roleCheckedAt: now };
  }
  return refreshTokenRole(db, token, now);
}
