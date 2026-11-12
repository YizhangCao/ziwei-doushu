import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { POST } from '@/app/api/v1/charts/route';
import { generateApiKey } from '@/lib/api/keys';
import { prisma } from '@/lib/db';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { resetDatabase } from '../helpers/reset';

// Fake birth data only (AGENTS.md: no real people's birth data in tests).
const VALID_BODY = { date: '1990-06-15', hour: 6, gender: 'female' };

interface StoredKey {
  id: string;
  plainKey: string;
  keyHash: string;
}

async function createKey(options: { revoked?: boolean } = {}): Promise<StoredKey> {
  const user = await prisma.user.create({ data: { email: `dev-${Date.now()}-${Math.random()}@example.test` } });
  const { plainKey, record } = generateApiKey();
  const row = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: 'Integration test key',
      ...record,
      revokedAt: options.revoked ? new Date() : null,
    },
  });
  return { id: row.id, plainKey, keyHash: record.keyHash };
}

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/v1/charts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const bearer = (key: string) => ({ Authorization: `Bearer ${key}` });

async function errorOf(response: Response): Promise<string> {
  const json = (await response.json()) as { error?: unknown };
  expect(typeof json.error).toBe('string');
  return json.error as string;
}

beforeEach(resetDatabase);
afterEach(() => vi.restoreAllMocks());
afterAll(() => prisma.$disconnect());

describe('POST /api/v1/charts — API key', () => {
  it('returns 401 without an Authorization header', async () => {
    const response = await POST(request(VALID_BODY));
    expect(response.status).toBe(401);
    expect(await errorOf(response)).toMatch(/api key/i);
  });

  it('returns 401 for a header that is not "Bearer <key>"', async () => {
    const { plainKey } = await createKey();
    const response = await POST(request(VALID_BODY, { Authorization: plainKey }));
    expect(response.status).toBe(401);
  });

  it('returns 401 for a key that does not exist', async () => {
    await createKey();
    const response = await POST(request(VALID_BODY, bearer(generateApiKey().plainKey)));
    expect(response.status).toBe(401);
    expect(await errorOf(response)).toMatch(/api key/i);
  });

  it('returns 401 for a revoked key', async () => {
    const { plainKey } = await createKey({ revoked: true });
    const response = await POST(request(VALID_BODY, bearer(plainKey)));
    expect(response.status).toBe(401);
  });

  it('accepts the auth scheme in any case (RFC 9110: "bearer", "BEARER")', async () => {
    const { plainKey } = await createKey();
    for (const scheme of ['bearer', 'BEARER', 'BeArEr']) {
      const response = await POST(request(VALID_BODY, { Authorization: `${scheme} ${plainKey}` }));
      expect(response.status, scheme).toBe(200);
    }
  });

  it('checks the key before the body: no key and a bad body is still 401', async () => {
    const response = await POST(request({ date: 'nope' }));
    expect(response.status).toBe(401);
  });
});

describe('POST /api/v1/charts — request body', () => {
  it('returns 400 with a clear message for invalid birth data', async () => {
    const { plainKey } = await createKey();
    const response = await POST(request({ ...VALID_BODY, hour: 12 }, bearer(plainKey)));
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toMatch(/^hour: /);
  });

  it('returns 400 for a body that is not JSON', async () => {
    const { plainKey } = await createKey();
    const response = await POST(request('{not json', bearer(plainKey)));
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toMatch(/json/i);
  });
});

describe('POST /api/v1/charts — success', () => {
  it('returns 200 with the chart JSON (12 palaces)', async () => {
    const { plainKey } = await createKey();
    const response = await POST(request(VALID_BODY, bearer(plainKey)));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);

    const { chart } = (await response.json()) as { chart: ZiweiChart };
    expect(chart.palaces).toHaveLength(12);
    expect(chart.birthInfo).toMatchObject({ year: 1990, month: 6, day: 15, hour: 6, gender: 'female' });
    expect(chart.palaces.filter((p) => p.isMingGong)).toHaveLength(1);
  });

  it('never includes the API key or its hash in the response', async () => {
    const { plainKey, keyHash } = await createKey();
    const response = await POST(request(VALID_BODY, bearer(plainKey)));
    const text = await response.text();
    expect(text).not.toContain(plainKey);
    expect(text).not.toContain(keyHash);
  });

  it('records when the key was last used', async () => {
    const { id, plainKey } = await createKey();
    await POST(request(VALID_BODY, bearer(plainKey)));
    const row = await prisma.apiKey.findUniqueOrThrow({ where: { id } });
    expect(row.lastUsedAt).toBeInstanceOf(Date);
  });
});

describe('POST /api/v1/charts — server errors', () => {
  it('returns 500 with a JSON { error } when the key lookup fails, without leaking the key or the cause', async () => {
    const { plainKey, keyHash } = await createKey();
    vi.spyOn(prisma.apiKey, 'findUnique').mockRejectedValueOnce(new Error('connection to db-internal-host timed out'));

    const response = await POST(request(VALID_BODY, bearer(plainKey)));
    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ error: expect.any(String) });
    for (const secret of [plainKey, keyHash, 'db-internal-host', 'timed out']) expect(text).not.toContain(secret);
  });
});
