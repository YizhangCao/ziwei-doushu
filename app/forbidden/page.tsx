/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The 403 page. The proxy rewrites to it, with a 403 status, when a
 * signed-in user opens a page their role does not allow.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '无权访问 · 紫微命盘',
  robots: { index: false },
};

/** Explains that the page needs another role and links back home. */
export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card-glass w-full max-w-sm rounded-xl p-8 text-center">
        <h1 className="text-lg font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>
          无权访问
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--t-faint)' }}>
          这个页面只对管理员开放。如果你需要权限，请联系管理员。
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full px-4 py-2 text-sm focus:outline-none focus-visible:ring-2"
          style={{ border: '1px solid var(--t-border)', color: 'var(--t-gold)' }}
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
