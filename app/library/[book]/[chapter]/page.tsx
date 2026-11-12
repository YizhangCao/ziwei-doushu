/**
 * /library/[book]/[chapter] — 单章节阅读页
 *
 * In English (#59) each passage keeps its original, marked lang="zh-Hans", followed by
 * `which means: "…"`; couplets keep their line breaks.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ALL_BOOKS, getChapter } from '@/lib/classics';
import { bookLabels, chapterLabels, passageMeaning } from '@/lib/classics/localize';

export async function generateStaticParams() {
  return ALL_BOOKS.flatMap(b =>
    b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) return {};
  const t = await getTranslations('library.meta');
  const locale = await getLocale();
  const book = bookLabels(result.book, locale);
  const chapter = chapterLabels(result.book, result.chapterIdx, locale);
  return {
    title: t('chapterTitle', { chapter: chapter.title, book: book.title }),
    description: chapter.subtitle || t('chapterDescription', { book: book.title, chapter: chapter.title }),
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: bookSlug, chapter: chIdx } = await params;
  const result = getChapter(bookSlug, parseInt(chIdx));
  if (!result) notFound();

  const { book, chapter, chapterIdx } = result;
  const prevIdx = chapterIdx - 1;
  const nextIdx = chapterIdx + 1;
  const t = await getTranslations('library');
  const locale = await getLocale();
  const labels = bookLabels(book, locale);
  const ch = chapterLabels(book, chapterIdx, locale);

  return (
    <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <article style={{ maxWidth: 720 }}>
        <nav aria-label={t('breadcrumb')} className="breadcrumb">
          <Link href="/library">{t('home')}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/library/${book.slug}`}>{t('bookTitle', { title: labels.title })}</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tx-0)' }}>{ch.title}</span>
        </nav>

        {/* 标题 */}
        <header className="mt-8 mb-8">
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('byline', { title: labels.title, dynasty: labels.dynasty })}</p>
          <h1 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{ch.title}</h1>
          {ch.subtitle && <p className="mt-2" style={{ color: 'var(--tx-2)' }}>{ch.subtitle}</p>}
          {/* The passages are modern summaries, not the classic's own words (#63) */}
          <p className="mt-4" style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-2)' }}>{t('summaryNotice')}</p>
        </header>

        {/* 原文：17px、行高 1.9，段与段之间 1px 细线；白话和倪师注是退后一级的灰底块 */}
        <div style={{ borderBottom: '1px solid var(--bdr)' }}>
          {chapter.paragraphs.map(p => {
            const meaning = passageMeaning(p.id, locale);
            return (
            <section key={p.id} id={p.id} className="py-6" style={{ borderTop: '1px solid var(--bdr)', scrollMarginTop: 'calc(var(--nav-h) + 16px)' }}>
              <div className="flex items-baseline gap-4">
                <span className="tabular-nums" style={{ minWidth: 24, fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
                  {String(p.idx).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <p lang="zh-Hans" style={{ fontSize: 'var(--fs-read)', lineHeight: 1.9, color: 'var(--tx-0)' }}>{p.text}</p>
                  {meaning && (
                    <p className="mt-3" style={{ fontSize: 'var(--fs-read)', lineHeight: 'var(--lh-read)', color: 'var(--tx-2)', whiteSpace: meaning.couplet ? 'pre-line' : undefined }}>
                      {t('meaning', { text: meaning.text })}
                    </p>
                  )}
                </div>
              </div>
              {p.translation && (
                <div className="mt-3 px-4 py-3" style={{ marginLeft: 40, background: 'var(--bg-1)', fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
                  <span className="mr-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-0)' }}>{t('modern')}</span>
                  {p.translation}
                </div>
              )}
              {p.niNote && (
                <div className="mt-3 px-4 py-3" style={{ marginLeft: 40, background: 'var(--bg-1)', fontSize: 'var(--fs-small)', lineHeight: 1.8, color: 'var(--tx-2)' }}>
                  <span className="mr-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-0)' }}>{t('niNote')}</span>
                  {p.niNote}
                </div>
              )}
            </section>
            );
          })}
        </div>

        {/* 章节导航 */}
        <nav aria-label={t('chapterNav')} className="mt-8 grid grid-cols-2 gap-4">
          {prevIdx >= 0 ? (
            <Link href={`/library/${book.slug}/${prevIdx}`} className="tile" style={{ padding: 16 }}>
              <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}><span aria-hidden="true">←</span> {t('prev')}</span>
              <span style={{ display: 'block', marginTop: 4 }}>{chapterLabels(book, prevIdx, locale).title}</span>
            </Link>
          ) : <span />}
          {nextIdx < book.chapters.length ? (
            <Link href={`/library/${book.slug}/${nextIdx}`} className="tile" style={{ padding: 16, textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('next')} <span aria-hidden="true">→</span></span>
              <span style={{ display: 'block', marginTop: 4 }}>{chapterLabels(book, nextIdx, locale).title}</span>
            </Link>
          ) : <span />}
        </nav>
      </article>
    </main>
  );
}
