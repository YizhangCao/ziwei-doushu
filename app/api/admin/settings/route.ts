import { auth } from '@/auth';
import { adminOrResponse, readJson } from '@/lib/admin/route';
import { getDailyAiLimit, setDailyAiLimit } from '@/lib/admin/settings';
import { prisma } from '@/lib/db';
import { parseDailyLimitUpdate } from '@/lib/validation/admin';

export const runtime = 'nodejs';

/** Reads the daily AI limit. Admins only. */
export const GET = auth(async function GET(request) {
  const admin = adminOrResponse(request);
  if (admin instanceof Response) return admin;

  return Response.json({ dailyAiLimit: await getDailyAiLimit(prisma) });
});

/** Sets the daily AI limit: `{ dailyAiLimit }`, an integer from 0 to 10000. Admins only. */
export const PUT = auth(async function PUT(request) {
  const admin = adminOrResponse(request);
  if (admin instanceof Response) return admin;

  const body = parseDailyLimitUpdate(await readJson(request));
  if (!body.ok) return Response.json({ error: body.error }, { status: 400 });

  return Response.json({ dailyAiLimit: await setDailyAiLimit(prisma, body.data.dailyAiLimit) });
});
