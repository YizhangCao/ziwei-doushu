import { auth } from '@/auth';
import { errorResponse } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { openThreadStream } from '@/lib/consultations/stream';

export const runtime = 'nodejs';
// The stream closes itself at 55 s (SSE_MAX_DURATION_MS); EventSource reconnects with Last-Event-ID.
export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

/** New messages in the thread over SSE. Access is checked before the stream opens. */
export const GET = auth(async function GET(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    return await openThreadStream(user, id, request);
  } catch (error) {
    return errorResponse(error);
  }
});
