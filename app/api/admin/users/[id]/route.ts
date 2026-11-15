import { auth } from '@/auth';
import { adminErrorResponse, adminOrResponse, readJson } from '@/lib/admin/route';
import { changeUserRole } from '@/lib/admin/users';
import { prisma } from '@/lib/db';
import { parseRoleChange } from '@/lib/validation/admin';

export const runtime = 'nodejs';

/** Changes a user's role: `{ role }`. Admins only, and never their own role. */
export const PATCH = auth(async function PATCH(request, context) {
  const admin = adminOrResponse(request);
  if (admin instanceof Response) return admin;

  const body = parseRoleChange(await readJson(request));
  if (!body.ok) return Response.json({ error: body.error }, { status: 400 });

  const { id } = (await context.params) as { id: string };
  try {
    return Response.json({ user: await changeUserRole(prisma, admin, id, body.data.role) });
  } catch (error) {
    return adminErrorResponse(error);
  }
});
