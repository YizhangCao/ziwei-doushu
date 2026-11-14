import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse, readJson, zodMessage } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { listMessages, postMessage } from '@/lib/consultations/service';
import { messageBodySchema } from '@/lib/validation/consultation-request';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/** The thread's messages, oldest first. Outside the thread → 404. */
export const GET = auth(async function GET(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    return NextResponse.json({ messages: await listMessages(user, id) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** Posts a message (201). Closed thread → 403; empty or over 2,000 characters → 400. */
export const POST = auth(async function POST(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = messageBodySchema.safeParse(body.value);
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error.issues) }, { status: 400 });
    return NextResponse.json({ message: await postMessage(user, id, parsed.data.body) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
});
