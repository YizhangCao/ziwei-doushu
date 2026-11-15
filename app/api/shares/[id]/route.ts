import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { getThread, revokeShare } from '@/lib/consultations/service';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/** The thread header for the owner or this share's practitioner. Anyone else → 404. */
export const GET = auth(async function GET(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    return NextResponse.json({ thread: await getThread(user, id) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** The owner revokes the share. The practitioner → 403; anyone else → 404. */
export const DELETE = auth(async function DELETE(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    return NextResponse.json({ share: await revokeShare(user, id) });
  } catch (error) {
    return errorResponse(error);
  }
});
