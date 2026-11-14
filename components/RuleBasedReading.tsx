'use client';
import { useMemo, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { buildRuleBasedReading } from '@/lib/reading/rule-based';
import type { Locale } from '@/lib/i18n/locale';
import type { ZiweiChart } from '@/lib/ziwei/types';

const CHINESE_RUN = /([㐀-鿿、·，]+)/;

/**
 * In English, star keywords stay in Chinese (they have no English version yet); mark each
 * Chinese run as such, as the site does for classical originals, so it is read correctly.
 */
function markChinese(text: string, locale: Locale): ReactNode {
  if (locale !== 'en') return text;
  return text.split(CHINESE_RUN).map((part, i) => (i % 2 === 1 ? <span key={i} lang="zh-Hans">{part}</span> : part));
}

/**
 * The free reading (#118): built in the browser from the chart by fixed rules, with no
 * request, so it shows for everyone and stays when the AI can't answer.
 */
export default function RuleBasedReading({ chart }: { chart: ZiweiChart }) {
  const t = useTranslations('reading');
  const locale = useLocale() as Locale;
  const reading = useMemo(() => buildRuleBasedReading(chart, locale), [chart, locale]);

  return (
    <section aria-labelledby="free-reading-title" className="card-glass" style={{ padding: 20 }}>
      <h2 id="free-reading-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--t-text)' }}>
        {t('freeTitle')}
      </h2>
      <p style={{ marginTop: 4, fontSize: 'var(--fs-caption)', color: 'var(--t-text2)' }}>{t('freeLead')}</p>
      {reading.note && (
        <p style={{ marginTop: 4, fontSize: 'var(--fs-caption)', color: 'var(--t-text2)' }}>{reading.note}</p>
      )}
      <p style={{ marginTop: 16, fontSize: 'var(--fs-body)', lineHeight: 1.7, color: 'var(--t-text)' }}>{markChinese(reading.overview, locale)}</p>
      <div style={{ marginTop: 8 }}>
        {reading.palaces.map((palace) => (
          <article key={palace.branch} style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid var(--t-border)' }}>
            <h3 style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--t-text)' }}>{palace.title}</h3>
            <p style={{ marginTop: 4, fontSize: 'var(--fs-small)', lineHeight: 1.7, color: 'var(--t-text2)' }}>{markChinese(palace.text, locale)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
