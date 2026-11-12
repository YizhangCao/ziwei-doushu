'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * 起盘页（#57）：一步表单 → 命盘 + AI 解读。
 *
 * 版式跟全站一致：页边距来自 .page，命盘和解读在 .chart-layout 里——手机上
 * 上下排，≥1024px 左右排。时间导航只有一条，在 ChartBoard 里。
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const t = useTranslations('chart');

  // ── 未起盘：出生信息表单 ──
  if (!chart) {
    return (
      <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t('title')}</h1>
          <p style={{ marginTop: 8, marginBottom: 32, color: 'var(--tx-2)' }}>
            {t('lead')}
          </p>
          <BirthForm onSubmit={(info: BirthInfo) => setChart(generateChart(info))} />
        </div>
      </main>
    );
  }

  // ── 已起盘：命盘 + 解读 ──
  return (
    <main className="page" style={{ paddingTop: 24, paddingBottom: 96 }}>
      <button
        type="button"
        className="btn-ghost btn-sm"
        onClick={() => { setChart(null); setSelectedPalace(null); }}
        style={{ marginBottom: 24 }}
      >
        <span aria-hidden="true">←</span> {t('rebuild')}
      </button>

      <div className="chart-layout">
        <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
        <InsightPanel chart={chart} selectedPalace={selectedPalace} />
      </div>
    </main>
  );
}
