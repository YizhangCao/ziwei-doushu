import { describe, it, expect } from 'vitest';
import { resumeCursor } from '@/lib/consultations/cursor';

const URL_BASE = 'https://example.test/api/shares/share1/stream';

function request(lastEventId?: string, query = ''): Request {
  const headers = lastEventId === undefined ? undefined : { 'Last-Event-ID': lastEventId };
  return new Request(URL_BASE + query, { headers });
}

describe('resumeCursor (lib/consultations/cursor.ts)', () => {
  it('reads a valid Last-Event-ID', () => {
    expect(resumeCursor(request('cm3abc123def'))).toBe('cm3abc123def');
  });

  it('starts from the beginning without a header or query', () => {
    expect(resumeCursor(request())).toBeNull();
  });

  it('ignores garbage, spaces inside, and ids over 64 characters', () => {
    expect(resumeCursor(request("x' OR 1=1 --"))).toBeNull();
    expect(resumeCursor(request('abc def'))).toBeNull();
    expect(resumeCursor(request('a'.repeat(65)))).toBeNull();
    expect(resumeCursor(request('a'.repeat(64)))).toBe('a'.repeat(64));
  });

  it('falls back to ?cursor= for a new EventSource, which sends no Last-Event-ID', () => {
    expect(resumeCursor(request(undefined, '?cursor=cm3newest'))).toBe('cm3newest');
    expect(resumeCursor(request(undefined, '?cursor=not%20valid'))).toBeNull();
  });

  it('prefers Last-Event-ID over ?cursor= when both are sent', () => {
    expect(resumeCursor(request('cm3fromheader', '?cursor=cm3fromquery'))).toBe('cm3fromheader');
  });
});
