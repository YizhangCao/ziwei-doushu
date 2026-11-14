import { z } from 'zod';
import type { BirthInfo } from '@/lib/ziwei/types';

// The years we promise in the public API docs. The engine handles more, but this is the
// range we test and support.
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function parseDateParts(value: string): { year: number; month: number; day: number } | null {
  const [year, month, day] = value.split('-').map(Number);
  // Round-trip through UTC so 2023-02-29 or 1990-04-31 are rejected instead of rolling over.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

/** Body of POST /api/v1/charts. Strict, so personal fields like a name are never accepted by mistake. */
export const publicChartRequestSchema = z
  .object(
    {
      date: z
        .string({ error: 'must be a string in YYYY-MM-DD format' })
        // abort: a malformed string would otherwise also fail the checks below and repeat itself.
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'must be in YYYY-MM-DD format', abort: true })
        .refine((value) => parseDateParts(value) !== null, { message: 'must be a real calendar date', abort: true })
        .refine((value) => {
          const year = Number(value.slice(0, 4));
          return year >= MIN_YEAR && year <= MAX_YEAR;
        }, `year must be between ${MIN_YEAR} and ${MAX_YEAR}`),
      hour: z
        .number({ error: 'must be an integer from 0 (子) to 11 (亥)' })
        .int('must be an integer from 0 (子) to 11 (亥)')
        .min(0, 'must be an integer from 0 (子) to 11 (亥)')
        .max(11, 'must be an integer from 0 (子) to 11 (亥)'),
      gender: z.enum(['male', 'female'], { error: 'must be "male" or "female"' }),
    },
    { error: 'Request body must be a JSON object' },
  )
  .strict();

export type PublicChartRequest = z.infer<typeof publicChartRequestSchema>;

export type ParsePublicChartResult = { ok: true; birthInfo: BirthInfo } | { ok: false; error: string };

export function parsePublicChartRequest(body: unknown): ParsePublicChartResult {
  const result = publicChartRequestSchema.safeParse(body);
  if (!result.success) {
    // "field: message; field: message", so API users see every problem in one response.
    const error = result.error.issues
      .map((issue) => {
        if (issue.code === 'unrecognized_keys') return `unknown field(s): ${issue.keys.join(', ')}`;
        return issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message;
      })
      .join('; ');
    return { ok: false, error };
  }

  const { date, hour, gender } = result.data;
  const parts = parseDateParts(date);
  // Unreachable after the refine above; keeps the types honest without a non-null assertion.
  if (!parts) return { ok: false, error: 'date: must be a real calendar date' };
  return { ok: true, birthInfo: { ...parts, hour, gender } };
}
