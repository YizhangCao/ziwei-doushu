/**
 * 古籍原典查询库 · 主页
 *
 * 列出所有收录古籍 + 全局搜索入口。版式随全站设计系统（#57）：左对齐、
 * 30px 标题、1px 细线方块，不用金色。
 */

import Link from 'next/link';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';

export const metadata = {
  title: '倪师方法论 · 古籍原典库 · 紫微斗数全集 / 全书 / 骨髓赋',
  description: '紫微斗数权威古籍全文检索：《紫微斗数全集》《紫微斗数全书》《骨髓赋》倪海厦《天纪》引证来源',
};

export default function LibraryHomePage() {
  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <header style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>倪海厦体系 · 引证来源</p>
        <h1 className="mt-4" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>
          古籍原典库
        </h1>
        <p className="mt-2" style={{ color: 'var(--tx-2)' }}>
          紫微斗数权威古籍全文检索：收录 {ALL_BOOKS.length} 部古籍，共 {TOTAL_PARAGRAPHS} 段原文。
        </p>
      </header>

      {/* 搜索 */}
      <div className="mt-8" style={{ maxWidth: 720 }}>
        <LibrarySearch />
      </div>

      {/* 古籍列表 */}
      <section aria-label="收录古籍" className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_BOOKS.map(book => (
          <Link key={book.slug} href={`/library/${book.slug}`} className="tile">
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
              {book.dynasty} · {book.author.split(' ')[0]}
            </div>
            <h2 className="mt-2" style={{ fontSize: 'var(--fs-read)', fontWeight: 600, color: 'var(--tx-0)' }}>
              《{book.title}》
            </h2>
            <p className="mt-2" style={{ fontSize: 'var(--fs-small)', lineHeight: 1.7, color: 'var(--tx-2)' }}>
              {book.intro}
            </p>
            <div className="mt-4 tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
              {book.chapters.length} 章 · {book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)} 段
            </div>
            <div className="mt-4" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-0)' }}>
              进入查阅 <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </section>

      {/* 底部说明 */}
      <section className="mt-16 pt-6" style={{ maxWidth: 720, borderTop: '1px solid var(--bdr)' }}>
        <h2 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--tx-0)' }}>关于本库</h2>
        <p className="mt-2" style={{ fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
          所收录古籍均为公版（明代刊本）。内容持续完善，未来将补全《紫微斗数全集》全本与倪海厦《天纪》引证目录。如发现任何错误请联系我们。
        </p>
      </section>
    </main>
  );
}
