import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse, readJson, zodMessage } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { appendToConversation, readConversation } from '@/lib/conversations/service';
import { appendConversationBodySchema } from '@/lib/validation/conversation-request';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/** The owner's saved conversation for this chart, oldest first (#22). Shared → 403, else 404. */
export const GET = auth(async function GET(request, context: Context) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ messages: await readConversation(requestUser(request.auth), id) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** Appends finished exchanges to the owner's conversation (204). /api/interpret stays as it is. */
export const POST = auth(async function POST(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = appendConversationBodySchema.safeParse(body.value);
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error.issues) }, { status: 400 });
    await appendToConversation(user, id, parsed.data.messages);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
});
