/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.2
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Account control in the site navigation (#15). It sits in SiteNav next to
 * the language and theme switches, so it uses the nav's own style: text at body size in
 * the text color, no pills and no gold (DESIGN.md). Its text comes from messages (#59).
 */

'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

/**
 * Shows a sign-in link to guests, and the user's name with a sign-out button to
 * signed-in users. Renders nothing while the session is loading, to avoid
 * flashing the wrong state.
 */
export default function UserMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations('auth.menu');
  if (status === 'loading') return null;

  if (!session?.user) {
    return (
      <Link href="/login" style={{ color: 'var(--tx-0)' }}>
        {t('signIn')}
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <span className="hidden sm:inline max-w-[8rem] truncate" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>
        {session.user.name ?? t('signedIn')}
      </span>
      <Link href="/settings" style={{ color: 'var(--tx-0)' }}>
        {t('settings')}
      </Link>
      <button
        type="button"
        onClick={() => signOut({ redirectTo: '/' })}
        style={{ background: 'transparent', border: 'none', padding: 0, minHeight: 44, color: 'var(--tx-0)', fontSize: 'inherit' }}
      >
        {t('signOut')}
      </button>
    </span>
  );
}
