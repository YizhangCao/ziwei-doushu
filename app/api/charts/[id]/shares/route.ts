import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse, readJson, zodMessage } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { listChartShares, shareChart } from '@/lib/consultations/service';
import { shareBodySchema } from '@/lib/validation/consultation-request';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/** The owner's active shares of this chart. Not theirs → 404; its practitioner → 403. */
export const GET = auth(async function GET(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    return NextResponse.json({ shares: await listChartShares(user, id) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** Shares the owner's chart with a practitioner by email (201). Sharing again is a no-op. */
export const POST = auth(async function POST(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = shareBodySchema.safeParse(body.value);
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error.issues) }, { status: 400 });
    return NextResponse.json({ share: await shareChart(user, id, parsed.data.email) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
});
