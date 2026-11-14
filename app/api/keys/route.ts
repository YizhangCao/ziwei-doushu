import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse, readJson, zodMessage } from '@/lib/api/http';
import { createApiKey, listApiKeys } from '@/lib/api/key-service';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { createApiKeyBodySchema } from '@/lib/validation/api-key-request';

export const runtime = 'nodejs';

/** The signed-in user's API keys, without the plain key or its hash. */
export const GET = auth(async function GET(request) {
  try {
    return NextResponse.json({ keys: await listApiKeys(requestUser(request.auth)) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** Creates a key. The response is the only place the plain key ever appears. */
export const POST = auth(async function POST(request) {
  try {
    const user = requireUser(requestUser(request.auth));
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = createApiKeyBodySchema.safeParse(body.value);
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error.issues) }, { status: 400 });

    const created = await createApiKey(user, parsed.data.name);
    // Never cache a response that carries a plain key.
    return NextResponse.json(created, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
});
