import { test, expect } from '@playwright/test';

// The public API (#24) against the seeded database: prisma/seed.ts stores the hash of
// E2E_API_KEY for the seeded member, so this spec can call the API with the plain key.
const API_KEY = process.env.E2E_API_KEY ?? '';

// Made-up birth data (AGENTS.md: no real people's birth data in tests).
const BODY = { date: '1992-03-08', hour: 4, gender: 'male' };

test.describe('POST /api/v1/charts', () => {
  test('E2E_API_KEY is set for this run', () => {
    expect(API_KEY, 'Set E2E_API_KEY (see .env.example) and seed the database').toMatch(/^zwk_/);
  });

  test('returns 200 and a 12-palace chart for the seeded key', async ({ request }) => {
    const response = await request.post('/api/v1/charts', {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: BODY,
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/);

    const { chart } = await response.json();
    expect(chart.palaces).toHaveLength(12);
    expect(chart.birthInfo).toMatchObject({ year: 1992, month: 3, day: 8, hour: 4, gender: 'male' });
  });

  test('returns 401 without an API key', async ({ request }) => {
    const response = await request.post('/api/v1/charts', { data: BODY });
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: expect.stringMatching(/api key/i) });
  });

  test('returns 401 for a key that does not exist', async ({ request }) => {
    const response = await request.post('/api/v1/charts', {
      headers: { Authorization: `Bearer zwk_${'1'.repeat(43)}` },
      data: BODY,
    });
    expect(response.status()).toBe(401);
  });

  test('returns 400 with a clear message for a bad body', async ({ request }) => {
    const response = await request.post('/api/v1/charts', {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: { ...BODY, hour: 12 },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: expect.stringMatching(/^hour: /) });
  });
});
