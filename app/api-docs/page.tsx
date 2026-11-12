/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Public API documentation page (#25), open to guests. */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ApiDocs from '@/components/ApiDocs';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('apiDocs');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

/** Introduces the API in the visitor's language (#59), then renders the OpenAPI document with Swagger UI. */
export default async function ApiDocsPage() {
  const t = await getTranslations('apiDocs');
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="card-glass rounded-xl p-6">
          <h1 className="text-xl font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>
            {t('title')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {t.rich('intro', { code: (chunks) => <code>{chunks}</code> })}
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--t-faint)' }}>
            {t.rich('spec', {
              link: (chunks) => (
                <a href="/api-docs/openapi.yaml" className="underline focus:outline-none focus-visible:ring-2" style={{ color: 'var(--t-gold)' }}>
                  {chunks}
                </a>
              ),
            })}
          </p>
        </header>
        <ApiDocs specUrl="/api-docs/openapi.yaml" />
      </div>
    </main>
  );
}
