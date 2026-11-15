/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Admin area (#23): manage user roles and the daily AI limit. */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import AdminPanel from '@/components/AdminPanel';
import ForbiddenPage from '@/app/forbidden/page';
import { getDailyAiLimit } from '@/lib/admin/settings';
import { pageAccess } from '@/lib/auth/page-access';
import { toSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin');
  return { title: t('metaTitle'), robots: { index: false } };
}

/**
 * Checks the session again (the proxy only answers early), then renders the admin
 * panel with the current daily AI limit.
 */
export default async function AdminPage() {
  const session = await auth();
  const user = toSessionUser({ sub: session?.user?.id, role: session?.user?.role });
  if (!user) redirect('/login?callbackUrl=%2Fadmin');
  if (pageAccess('/admin', user) === 'forbidden') return <ForbiddenPage />;

  return <AdminPanel initialDailyAiLimit={await getDailyAiLimit(prisma)} currentUserId={user.id} />;
}
