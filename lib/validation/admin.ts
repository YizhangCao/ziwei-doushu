/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview zod schemas for the admin API: role changes, the daily AI limit, user search. */

import { z } from 'zod';

/** Highest daily AI limit an admin can set; anything above is almost certainly a typo. */
export const MAX_DAILY_AI_LIMIT = 10_000;

const roleChangeSchema = z.object({ role: z.enum(['member', 'practitioner', 'admin']) }).strict();

const dailyLimitSchema = z
  .object({
    dailyAiLimit: z
      .number({ error: 'must be an integer' })
      .int('must be an integer')
      .min(0, 'must be 0 or more')
      .max(MAX_DAILY_AI_LIMIT, `must be at most ${MAX_DAILY_AI_LIMIT}`),
  })
  .strict();

const userSearchSchema = z.object({ q: z.string().trim().max(100, 'must be at most 100 characters') });

export type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

/** Formats zod issues as "field: message; field: message". */
function toError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      if (issue.code === 'unrecognized_keys') return `unknown field(s): ${issue.keys.join(', ')}`;
      return issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

function parse<T>(schema: z.ZodType<T>, value: unknown): Parsed<T> {
  const result = schema.safeParse(value);
  return result.success ? { ok: true, data: result.data } : { ok: false, error: toError(result.error) };
}

/** Body of PATCH /api/admin/users/:id. */
export const parseRoleChange = (body: unknown) => parse(roleChangeSchema, body);

/** Body of PUT /api/admin/settings. */
export const parseDailyLimitUpdate = (body: unknown) => parse(dailyLimitSchema, body);

/** Query of GET /api/admin/users; a missing `q` lists the newest users. */
export const parseUserSearch = (params: URLSearchParams) => parse(userSearchSchema, { q: params.get('q') ?? '' });
