/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Account control in the home page navigation bar. */

'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

const PILL = 'text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full focus:outline-none focus-visible:ring-2';

/**
 * Shows a login link to guests, and the user's name with a logout button to
 * signed-in users. Renders nothing while the session is loading, to avoid
 * flashing the wrong state.
 */
export default function UserMenu() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;

  if (!session?.user) {
    return (
      <Link href="/login" className={PILL} style={{ border: '1px solid var(--t-border)', color: 'var(--t-gold)' }}>
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <span className="text-[11px] sm:text-xs max-w-[8rem] truncate" style={{ color: 'var(--t-faint)' }}>
        {session.user.name ?? '已登录'}
      </span>
      <button
        type="button"
        onClick={() => signOut({ redirectTo: '/' })}
        className={PILL}
        style={{ border: '1px solid var(--t-border)', color: 'var(--t-faint)' }}
      >
        退出登录
      </button>
    </div>
  );
}
