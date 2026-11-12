/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview The 404 page (#57), on the design system instead of Next's default white page. */

import Link from 'next/link';

export const metadata = {
  title: '页面不存在 · 紫微命盘',
  robots: { index: false },
};

/** Says the page is missing and offers the two ways back. */
export default function NotFound() {
  return (
    <main className="page" style={{ paddingTop: 96, paddingBottom: 96 }}>
      <p className="tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>404</p>
      <h1 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>这个页面不存在</h1>
      <p className="mt-2" style={{ color: 'var(--tx-2)' }}>链接可能已失效，或内容还在整理中。</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/chart" className="btn-primary">起盘 <span aria-hidden="true">→</span></Link>
        <Link href="/" className="btn-ghost">回到首页</Link>
      </div>
    </main>
  );
}
