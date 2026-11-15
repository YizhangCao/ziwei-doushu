import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse, readJson, zodMessage } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { createChart, listCharts } from '@/lib/charts/service';
import { createChartBodySchema } from '@/lib/validation/chart-request';
import type { BirthInfo } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

/** The signed-in user's saved charts, newest first (no birth data). */
export const GET = auth(async function GET(request) {
  try {
    return NextResponse.json({ charts: await listCharts(requestUser(request.auth)) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** Saves a chart for the signed-in user. The session is checked before the body is read. */
export const POST = auth(async function POST(request) {
  try {
    const user = requireUser(requestUser(request.auth));
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = createChartBodySchema.safeParse(body.value);
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error.issues) }, { status: 400 });

    // createChart validates the birth data in full and throws a 400 error if it's wrong.
    const chart = await createChart(user, { name: parsed.data.name, birthInfo: parsed.data.birthInfo as unknown as BirthInfo });
    return NextResponse.json({ chart }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
});
