import { describe, it, expect } from 'vitest';
import { Client } from 'pg';

// Integration tests must only ever touch the test database (AGENTS.md "Testing strategy").
describe('integration harness', () => {
  it('requires DATABASE_URL_TEST', () => {
    expect(process.env.DATABASE_URL_TEST, 'DATABASE_URL_TEST is not set').toBeTruthy();
  });

  it('points DATABASE_URL at the test database, so Prisma cannot reach dev or prod', () => {
    expect(process.env.DATABASE_URL, 'DATABASE_URL is not set').toBeTruthy();
    expect(process.env.DATABASE_URL).toBe(process.env.DATABASE_URL_TEST);
  });

  it('can query the test database', async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL_TEST });
    await client.connect();
    try {
      const { rows } = await client.query<{ ok: number }>('SELECT 1 AS ok');
      expect(rows[0].ok).toBe(1);
    } finally {
      await client.end();
    }
  });
});
