import { z } from 'zod';
import type { BirthInfo } from '@/lib/ziwei/types';

// Birth data as BirthForm builds it (formToBirthInfo) and the engine reads it. Used on write
// (createChart) and on read (decryptBirthInfo), so a chart can never be saved in a shape that
// fails to load later.

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function isRealDate(year: number, month: number, day: number): boolean {
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

const int = (min: number, max: number) => {
  const message = `must be an integer from ${min} to ${max}`;
  return z.number({ error: message }).int(message).min(min, message).max(max, message);
};

export const birthInfoSchema = z
  .object(
    {
      year: int(MIN_YEAR, MAX_YEAR),
      month: int(1, 12),
      day: int(1, 31),
      hour: z
        .number({ error: 'must be an integer from 0 (子) to 11 (亥)' })
        .int('must be an integer from 0 (子) to 11 (亥)')
        .min(0, 'must be an integer from 0 (子) to 11 (亥)')
        .max(11, 'must be an integer from 0 (子) to 11 (亥)'),
      gender: z.enum(['male', 'female'], { error: 'must be "male" or "female"' }),
      name: z.string().max(80).optional(),
      province: z.string().max(40).optional(),
      city: z.string().max(40).optional(),
      longitude: z.number({ error: 'must be a number' }).min(-180).max(180).optional(),
      origInput: z
        .object({
          year: z.number().int(),
          month: z.number().int(),
          day: z.number().int(),
          clockHour: z.number().int().min(0).max(23),
          clockMinute: z.number().int().min(0).max(59),
        })
        .optional(),
    },
    { error: 'Birth data must be an object' },
  )
  .refine((b) => isRealDate(b.year, b.month, b.day), { message: 'must be a real calendar date', path: ['day'] });

export type ParseBirthInfoResult = { ok: true; birthInfo: BirthInfo } | { ok: false; error: string };

export function parseBirthInfo(value: unknown): ParseBirthInfoResult {
  const result = birthInfoSchema.safeParse(value);
  if (!result.success) {
    const error = result.error.issues
      .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
      .join('; ');
    return { ok: false, error };
  }
  return { ok: true, birthInfo: result.data };
}
