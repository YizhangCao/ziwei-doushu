import { describe, it, expect } from 'vitest';
import { parseBirthInfo } from '@/lib/validation/birth-info';

// Made-up birth data (AGENTS.md: no real people's birth data in tests).
const VALID = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' };

function errorFor(value: unknown): string {
  const result = parseBirthInfo(value);
  if (result.ok) throw new Error('expected the birth data to be rejected');
  return result.error;
}

describe('parseBirthInfo — birth data before it is encrypted and saved', () => {
  it('accepts engine birth data', () => {
    expect(parseBirthInfo(VALID)).toEqual({ ok: true, birthInfo: VALID });
  });

  it('keeps the optional fields BirthForm sends', () => {
    const full = {
      ...VALID,
      name: '测试',
      province: '测试省',
      city: '测试市',
      longitude: 116.4,
      origInput: { year: 1990, month: 6, day: 15, clockHour: 12, clockMinute: 30 },
    };
    expect(parseBirthInfo(full)).toEqual({ ok: true, birthInfo: full });
  });

  it('rejects an hour outside the 0–11 branch index', () => {
    for (const hour of [-1, 12, 23, 6.5]) expect(errorFor({ ...VALID, hour })).toMatch(/^hour: /);
  });

  it('rejects a date that does not exist', () => {
    expect(errorFor({ ...VALID, year: 2023, month: 2, day: 29 })).toMatch(/real calendar date/);
    expect(errorFor({ ...VALID, month: 4, day: 31 })).toMatch(/real calendar date/);
    expect(errorFor({ ...VALID, month: 13 })).toMatch(/^month: /);
  });

  it('rejects a year outside 1900–2100', () => {
    expect(errorFor({ ...VALID, year: 1899 })).toMatch(/^year: /);
    expect(errorFor({ ...VALID, year: 2101 })).toMatch(/^year: /);
  });

  it('rejects an unknown gender', () => {
    expect(errorFor({ ...VALID, gender: 'other' })).toMatch(/^gender: /);
  });

  it('rejects missing fields and non-objects', () => {
    const { year: _year, ...noYear } = VALID;
    expect(errorFor(noYear)).toMatch(/^year: /);
    expect(errorFor(null)).toMatch(/object/i);
    expect(errorFor('1990-06-15')).toMatch(/object/i);
  });

  it('rejects malformed optional fields', () => {
    expect(errorFor({ ...VALID, longitude: 'east' })).toMatch(/^longitude: /);
    expect(errorFor({ ...VALID, origInput: { year: 1990 } })).toMatch(/^origInput\./);
  });
});
