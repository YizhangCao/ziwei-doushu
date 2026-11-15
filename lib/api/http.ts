import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth/guards';

// Shared by the session-protected JSON routes (/api/charts, /api/keys): read the body, and
// turn the errors that lib/ functions throw into the `{ error }` responses AGENTS.md defines.

export type JsonBody = { ok: true; value: unknown } | { ok: false; response: Response };

/** Parses the JSON body, or gives the 400 response to return. */
export async function readJson(request: Request): Promise<JsonBody> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }) };
  }
}

/** An error a lib/ function throws for bad input from the caller (status 400). */
interface InputError extends Error {
  readonly status: 400;
}

const isInputError = (error: unknown): error is InputError =>
  error instanceof Error && (error as { status?: unknown }).status === 400;

/** 401/403/404 from the auth guards, 400 for bad input, otherwise 500 without details. */
export function errorResponse(error: unknown): Response {
  if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (isInputError(error)) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/** "field: message; field: message" from a zod error, the format the other routes use. */
export function zodMessage(issues: readonly { path: readonly PropertyKey[]; message: string }[]): string {
  return issues.map((i) => (i.path.length ? `${i.path.map(String).join('.')}: ${i.message}` : i.message)).join('; ');
}
