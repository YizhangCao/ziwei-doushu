import { auth } from '@/auth';
import { errorResponse } from '@/lib/api/http';
import { revokeApiKey } from '@/lib/api/key-service';
import { requestUser } from '@/lib/auth/request-user';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/** Revokes one of the signed-in user's keys (204). Someone else's or a missing key → 404. */
export const DELETE = auth(async function DELETE(request, context: Context) {
  try {
    const { id } = await context.params;
    await revokeApiKey(requestUser(request.auth), id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
});
