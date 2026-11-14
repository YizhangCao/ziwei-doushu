import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { listSharedWithMe } from '@/lib/consultations/service';

export const runtime = 'nodejs';

/** Charts shared with the signed-in practitioner, newest first. A member → 403. */
export const GET = auth(async function GET(request) {
  try {
    const user = requireUser(requestUser(request.auth));
    return NextResponse.json({ consultations: await listSharedWithMe(user) });
  } catch (error) {
    return errorResponse(error);
  }
});
