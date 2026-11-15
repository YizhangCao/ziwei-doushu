import { auth } from '@/auth';
import { adminOrResponse } from '@/lib/admin/route';
import { searchUsers } from '@/lib/admin/users';
import { prisma } from '@/lib/db';
import { parseUserSearch } from '@/lib/validation/admin';

export const runtime = 'nodejs';

/** Lists users whose name, email or GitHub id contains `q`. Admins only. */
export const GET = auth(async function GET(request) {
  const admin = adminOrResponse(request);
  if (admin instanceof Response) return admin;

  const query = parseUserSearch(request.nextUrl.searchParams);
  if (!query.ok) return Response.json({ error: query.error }, { status: 400 });

  return Response.json({ users: await searchUsers(prisma, query.data.q) });
});
