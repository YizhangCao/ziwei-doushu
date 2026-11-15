/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Unit tests for `clientIp`, which picks the caller's IP for per-IP limits. */

import { describe, it, expect } from 'vitest';
import { clientIp } from '@/lib/rate-limit/client-ip';

describe('clientIp(headers)', () => {
  it('takes the first address in x-forwarded-for (the client, as Vercel sets it)', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4');
  });

  it('returns "unknown" when neither header is set, so those requests share one bucket', () => {
    expect(clientIp(new Headers())).toBe('unknown');
    expect(clientIp(new Headers({ 'x-forwarded-for': ' , ' }))).toBe('unknown');
  });
});
