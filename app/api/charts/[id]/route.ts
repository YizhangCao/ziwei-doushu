import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { errorResponse, readJson, zodMessage } from '@/lib/api/http';
import { requireUser } from '@/lib/auth/guards';
import { requestUser } from '@/lib/auth/request-user';
import { deleteChart, getChart, renameChart } from '@/lib/charts/service';
import { renameChartBodySchema } from '@/lib/validation/chart-request';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/** One chart with its birth data: the owner's, or one shared with this practitioner. Else 404. */
export const GET = auth(async function GET(request, context: Context) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ chart: await getChart(requestUser(request.auth), id) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** Renames the owner's chart. Not theirs → 404; shared with a practitioner → 403. */
export const PATCH = auth(async function PATCH(request, context: Context) {
  try {
    const user = requireUser(requestUser(request.auth));
    const { id } = await context.params;
    const body = await readJson(request);
    if (!body.ok) return body.response;
    const parsed = renameChartBodySchema.safeParse(body.value);
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error.issues) }, { status: 400 });
    return NextResponse.json({ chart: await renameChart(user, id, parsed.data.name) });
  } catch (error) {
    return errorResponse(error);
  }
});

/** Deletes the owner's chart (204). Not theirs → 404; shared with a practitioner → 403. */
export const DELETE = auth(async function DELETE(request, context: Context) {
  try {
    const { id } = await context.params;
    await deleteChart(requestUser(request.auth), id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
});
