/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Unit test for GET /api-docs/openapi.yaml, which Swagger UI loads. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api-docs/openapi.yaml/route';

describe('GET /api-docs/openapi.yaml', () => {
  it('serves docs/openapi.yaml as YAML', async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^application\/yaml/);
    expect(await res.text()).toBe(readFileSync(fileURLToPath(new URL('../../docs/openapi.yaml', import.meta.url)), 'utf8'));
  });
});
