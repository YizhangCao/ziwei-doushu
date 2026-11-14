/**
 * /library/[book]/[chapter] — 单章节阅读页
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getChapter } from '@/lib/classics';

export async function generateStaticParams() {
  return ALL_BOOKS.flatMap(b =>
    b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) return {};
  return {
    title: `${result.chapter.title} · 《${result.book.title}》· 紫微斗数古籍`,
    description: result.chapter.subtitle || `《${result.book.title}》${result.chapter.title}原文`,
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) notFound();

  const { book, chapter, chapterIdx } = result;
  const prevIdx = chapterIdx - 1;
  const nextIdx = chapterIdx + 1;

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <article style={{ maxWidth: 720 }}>
        <nav aria-label="面包屑" className="breadcrumb">
          <Link href="/library">古籍库</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/library/${book.slug}`}>《{book.title}》</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tx-0)' }}>{chapter.title}</span>
        </nav>

        {/* 标题 */}
        <header className="mt-8 mb-8">
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>《{book.title}》 · {book.dynasty}</p>
          <h1 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{chapter.title}</h1>
          {chapter.subtitle && <p className="mt-2" style={{ color: 'var(--tx-2)' }}>{chapter.subtitle}</p>}
        </header>

        {/* 原文：17px、行高 1.9，段与段之间 1px 细线；白话和倪师注是退后一级的灰底块 */}
        <div style={{ borderBottom: '1px solid var(--bdr)' }}>
          {chapter.paragraphs.map(p => (
            <section key={p.id} id={p.id} className="py-6" style={{ borderTop: '1px solid var(--bdr)', scrollMarginTop: 'calc(var(--nav-h) + 16px)' }}>
              <div className="flex items-baseline gap-4">
                <span className="tabular-nums" style={{ minWidth: 24, fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
                  {String(p.idx).padStart(2, '0')}
                </span>
                <p style={{ flex: 1, fontSize: 'var(--fs-read)', lineHeight: 1.9, color: 'var(--tx-0)' }}>{p.text}</p>
              </div>
              {p.translation && (
                <div className="mt-3 px-4 py-3" style={{ marginLeft: 40, background: 'var(--bg-1)', fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
                  <span className="mr-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-0)' }}>白话</span>
                  {p.translation}
                </div>
              )}
              {p.niNote && (
                <div className="mt-3 px-4 py-3" style={{ marginLeft: 40, background: 'var(--bg-1)', fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
                  <span className="mr-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-0)' }}>倪师注</span>
                  {p.niNote}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* 章节导航 */}
        <nav aria-label="章节导航" className="mt-8 grid grid-cols-2 gap-4">
          {prevIdx >= 0 ? (
            <Link href={`/library/${book.slug}/${prevIdx}`} className="tile" style={{ padding: 16 }}>
              <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}><span aria-hidden="true">←</span> 上一章</span>
              <span style={{ display: 'block', marginTop: 4 }}>{book.chapters[prevIdx].title}</span>
            </Link>
          ) : <span />}
          {nextIdx < book.chapters.length ? (
            <Link href={`/library/${book.slug}/${nextIdx}`} className="tile" style={{ padding: 16, textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>下一章 <span aria-hidden="true">→</span></span>
              <span style={{ display: 'block', marginTop: 4 }}>{book.chapters[nextIdx].title}</span>
            </Link>
          ) : <span />}
        </nav>
      </article>
    </main>
  );
}
