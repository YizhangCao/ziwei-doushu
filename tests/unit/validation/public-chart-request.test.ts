import { describe, it, expect } from 'vitest';
import { parsePublicChartRequest } from '@/lib/validation/public-chart-request';

// Fake birth data only (AGENTS.md: no real people's birth data in tests).
const VALID = { date: '1990-06-15', hour: 6, gender: 'female' };

// Returns the error message for an invalid body, failing the test if the body was accepted.
function errorFor(body: unknown): string {
  const result = parsePublicChartRequest(body);
  if (result.ok) throw new Error('expected the body to be rejected');
  return result.error;
}

describe('parsePublicChartRequest — POST /api/v1/charts body', () => {
  it('accepts valid birth data and returns engine BirthInfo', () => {
    const result = parsePublicChartRequest(VALID);
    expect(result).toEqual({ ok: true, birthInfo: { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' } });
  });

  it('accepts both genders and every hour branch from 0 (子) to 11 (亥)', () => {
    for (const gender of ['male', 'female']) {
      for (let hour = 0; hour <= 11; hour++) {
        expect(parsePublicChartRequest({ ...VALID, gender, hour }).ok).toBe(true);
      }
    }
  });

  it('rejects a body that is not an object', () => {
    expect(errorFor(null)).toMatch(/object/i);
    expect(errorFor('1990-06-15')).toMatch(/object/i);
  });

  describe('date', () => {
    it('rejects a missing date', () => {
      const { date: _date, ...rest } = VALID;
      expect(errorFor(rest)).toMatch(/^date: /);
    });

    it('rejects a date that is not YYYY-MM-DD', () => {
      for (const date of ['15/06/1990', '1990-6-15', '1990-06-15T00:00:00Z', 19900615]) {
        expect(errorFor({ ...VALID, date })).toMatch(/^date: .*YYYY-MM-DD/);
      }
    });

    it('rejects a calendar date that does not exist', () => {
      for (const date of ['2023-02-29', '1990-04-31', '1990-13-01', '1990-00-10']) {
        expect(errorFor({ ...VALID, date })).toMatch(/^date: .*real calendar date/);
      }
    });

    it('accepts 29 February in a leap year', () => {
      expect(parsePublicChartRequest({ ...VALID, date: '2024-02-29' }).ok).toBe(true);
    });

    it('rejects years outside 1900–2100', () => {
      expect(errorFor({ ...VALID, date: '1899-12-31' })).toMatch(/^date: .*1900.*2100/);
      expect(errorFor({ ...VALID, date: '2101-01-01' })).toMatch(/^date: .*1900.*2100/);
    });
  });

  describe('hour (时辰 branch index, not a clock hour)', () => {
    it('rejects hours outside 0–11', () => {
      for (const hour of [-1, 12, 23]) {
        expect(errorFor({ ...VALID, hour })).toMatch(/^hour: .*0.*11/);
      }
    });

    it('rejects a non-integer or non-number hour', () => {
      for (const hour of [6.5, '6', null]) {
        expect(errorFor({ ...VALID, hour })).toMatch(/^hour: /);
      }
    });
  });

  describe('gender', () => {
    it('rejects an unknown gender', () => {
      for (const gender of ['other', 'M', '', 1]) {
        expect(errorFor({ ...VALID, gender })).toMatch(/^gender: .*"male" or "female"/);
      }
    });
  });

  it('rejects unknown fields, so names or birthplaces are never accepted by mistake', () => {
    expect(errorFor({ ...VALID, name: 'Test Person' })).toMatch(/name/);
  });

  it('reports every problem at once', () => {
    const error = errorFor({ date: 'nope', hour: 12, gender: 'x' });
    expect(error).toMatch(/date: /);
    expect(error).toMatch(/hour: /);
    expect(error).toMatch(/gender: /);
  });
});
