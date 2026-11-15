'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import AiReadingSection from '@/components/AiReadingSection';
import RuleBasedReading from '@/components/RuleBasedReading';
import SaveChartPanel from '@/components/SaveChartPanel';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * 起盘页（#57）：一步表单 → 命盘 + 解读。解读分两层（#118）：会员的 AI 解读在上，
 * 人人可见的基础解读在下，AI 不可用时基础解读照常显示。
 *
 * 版式跟全站一致：页边距来自 .page，命盘和解读在 .chart-layout 里——手机上
 * 上下排，≥1024px 左右排。时间导航只有一条，在 ChartBoard 里。
 * 已保存的命盘（#18）从 /chart?id=… 打开，起盘后可以保存。
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  // The form's own input (with birthplace and clock time), which is what gets saved.
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [savedName, setSavedName] = useState<string | undefined>(undefined);
  // The saved chart's id, once there is one: the reading panel keeps its conversation there (#22).
  const [chartId, setChartId] = useState<string | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const t = useTranslations('chart');

  const show = (info: BirthInfo, name?: string, id?: string) => {
    setBirthInfo(info);
    setSavedName(name);
    setChartId(id);
    setChart(generateChart(info));
  };

  // /chart?id=<saved chart> (from /charts): load the birth data and rebuild the chart here.
  // Read from window.location so the page needs no Suspense boundary for useSearchParams.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/charts/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(String(res.status));
        const { chart: saved } = (await res.json()) as { chart: { name: string; birthInfo: BirthInfo } };
        if (!cancelled) show(saved.birthInfo, saved.name, id);
      } catch {
        if (!cancelled) setLoadError(t('loadError'));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── 未起盘：出生信息表单 ──
  if (!chart || !birthInfo) {
    return (
      <main className="page" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t('title')}</h1>
          <p style={{ marginTop: 8, marginBottom: 32, color: 'var(--tx-2)' }}>
            {t('lead')}
          </p>
          {loadError && <p role="alert" style={{ color: 'var(--ji)', marginBottom: 16 }}>{loadError}</p>}
          <BirthForm onSubmit={(info: BirthInfo) => show(info)} />
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
        onClick={() => { setChart(null); setBirthInfo(null); setSavedName(undefined); setChartId(undefined); setSelectedPalace(null); }}
        style={{ marginBottom: 24 }}
      >
        <span aria-hidden="true">←</span> {t('rebuild')}
      </button>

      <SaveChartPanel key={savedName ?? 'new'} birthInfo={birthInfo} savedName={savedName} onSaved={setChartId} />

      <div className="chart-layout">
        <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
        <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
          <AiReadingSection chart={chart} selectedPalace={selectedPalace} chartId={chartId} />
          <RuleBasedReading chart={chart} />
        </div>
      </div>
    </main>
  );
}
