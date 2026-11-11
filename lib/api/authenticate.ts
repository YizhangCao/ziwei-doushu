import { prisma } from '@/lib/db';
import { hashApiKey, verifyApiKey } from './keys';

export interface ApiKeyCaller {
  apiKeyId: string;
  userId: string;
}

/**
 * Resolves an `Authorization: Bearer <key>` header to the key's owner, or null for a missing,
 * malformed, unknown, or revoked key. Callers answer every null with the same 401, so a
 * response never says which of those it was.
 */
export async function authenticateApiKey(authorization: string | null): Promise<ApiKeyCaller | null> {
  const match = authorization?.match(/^Bearer\s+(\S+)$/);
  if (!match) return null;
  const plainKey = match[1];

  const stored = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(plainKey) },
    select: { id: true, userId: true, keyHash: true, revokedAt: true },
  });
  if (!stored || !verifyApiKey(plainKey, stored)) return null;

  await prisma.apiKey.update({ where: { id: stored.id }, data: { lastUsedAt: new Date() } });
  return { apiKeyId: stored.id, userId: stored.userId };
}
