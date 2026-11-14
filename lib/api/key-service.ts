import { AuthError, requireUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/types';
import { prisma } from '@/lib/db';
import { generateApiKey } from './keys';

// API keys on /settings (#24). The plain key exists only in createApiKey's return value: it is
// shown to the user once and never stored, logged or listed.

/** A key as /settings lists it: no plain key, no hash. */
export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

/** Invalid input from the caller; a route turns it into 400 `{ error }`. */
export class ApiKeyInputError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyInputError';
  }
}

const MAX_NAME_LENGTH = 60;
/** Active (unrevoked) keys one user may have, so a loop of POSTs can't fill the table. */
export const MAX_ACTIVE_KEYS = 10;

const SUMMARY_SELECT = { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true, revokedAt: true } as const;

export async function createApiKey(
  sessionUser: SessionUser | null,
  name: string,
): Promise<{ key: ApiKeySummary; plainKey: string }> {
  const user = requireUser(sessionUser);
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new ApiKeyInputError('name: must not be empty');
  if (trimmed.length > MAX_NAME_LENGTH) throw new ApiKeyInputError(`name: must be at most ${MAX_NAME_LENGTH} characters`);

  const { plainKey, record } = generateApiKey();
  const key = await prisma.$transaction(async (tx) => {
    // Serializes this user's creates until commit, so two requests can't both count 9 and
    // insert. Other users' creates don't wait (the lock is keyed by user id).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'api-keys:' + user.id}))`;
    const active = await tx.apiKey.count({ where: { userId: user.id, revokedAt: null } });
    if (active >= MAX_ACTIVE_KEYS) {
      throw new ApiKeyInputError(`You can have at most ${MAX_ACTIVE_KEYS} active API keys. Revoke one to create another.`);
    }
    return tx.apiKey.create({ data: { userId: user.id, name: trimmed, ...record }, select: SUMMARY_SELECT });
  });
  return { key, plainKey };
}

/** The user's keys, newest first, revoked ones included so the history stays visible. */
export async function listApiKeys(sessionUser: SessionUser | null): Promise<ApiKeySummary[]> {
  const user = requireUser(sessionUser);
  return prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: SUMMARY_SELECT,
  });
}

/** Owner only. Someone else's key, or a missing one, is 404, so ids can't be probed. */
export async function revokeApiKey(sessionUser: SessionUser | null, keyId: string): Promise<void> {
  const user = requireUser(sessionUser);
  const key = await prisma.apiKey.findUnique({ where: { id: keyId }, select: { userId: true, revokedAt: true } });
  if (!key || key.userId !== user.id) throw new AuthError(404, 'API key not found');
  // Revoking twice keeps the first time.
  if (key.revokedAt) return;
  await prisma.apiKey.update({ where: { id: keyId }, data: { revokedAt: new Date() } });
}
