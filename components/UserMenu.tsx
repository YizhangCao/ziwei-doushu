'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

const PILL = 'text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full focus:outline-none focus-visible:ring-2';

// Login link for guests; name and logout for members (#15).
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
