'use client';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { termLabel } from '@/lib/i18n/glossary';
import { STEMS, SI_HUA_TABLE } from '@/lib/ziwei/constants';
import type { ZiweiChart } from '@/lib/ziwei/types';

export type TimeView = 'mingpan' | 'daxian' | 'liunian';

interface TimeNavProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  onViewChange: (view: TimeView) => void;
  onYearChange: (year: number) => void;
}

/** 由年份计算天干索引 (0-9) */
export function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

/** 根据天干索引返回四化映射：starName → SiHua */
export function buildSiHuaOverlay(stemIndex: number): Record<string, string> {
  const stars = SI_HUA_TABLE[stemIndex];
  if (!stars) return {};
  return {
    [stars[0]]: '禄',
    [stars[1]]: '权',
    [stars[2]]: '科',
    [stars[3]]: '忌',
  };
}

const SIHUA_COLORS: Record<string, string> = {
  '禄': 'var(--lu)',
  '权': 'var(--quan)',
  '科': 'var(--ke)',
  '忌': 'var(--ji)',
};

export default function TimeNav({
  chart,
  view,
  liunianYear,
  onViewChange,
  onYearChange,
}: TimeNavProps) {
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const t = useTranslations('timeNav');
  const locale = useLocale();
  const term = (zh: string) => termLabel(zh, locale);

  // 计算当前叠加四化信息
  const getOverlayInfo = (): { stemName: string; overlay: Record<string, string> } | null => {
    if (view === 'mingpan') return null;

    if (view === 'daxian' && currentDx) {
      const dxPalace = chart.palaces.find(p => p.branch === currentDx.palaceBranch);
      if (!dxPalace) return null;
      const stemIndex = dxPalace.stem;
      return {
        stemName: STEMS[stemIndex],
        overlay: buildSiHuaOverlay(stemIndex),
      };
    }

    if (view === 'liunian') {
      const stemIndex = getYearStemIndex(liunianYear);
      return {
        stemName: STEMS[stemIndex],
        overlay: buildSiHuaOverlay(stemIndex),
      };
    }

    return null;
  };

  const overlayInfo = getOverlayInfo();

  return (
    <div className="mb-3">
      {/* Tab 行 */}
      <div
        className="flex items-stretch gap-1"
        style={{ borderBottom: '1px solid var(--t-border)' }}
      >
        {/* 本命 */}
        <TabButton
          active={view === 'mingpan'}
          onClick={() => onViewChange('mingpan')}
        >
          {t('natal')}
        </TabButton>

        {/* 大限 */}
        <TabButton
          active={view === 'daxian'}
          onClick={() => onViewChange('daxian')}
        >
          {currentDx ? t('decadeAges', { start: currentDx.startAge, end: currentDx.endAge }) : t('decade')}
        </TabButton>

        {/* 流年 — 含年份切换 */}
        <div
          className="relative flex-1 flex items-center justify-center gap-1"
          style={{ boxShadow: view === 'liunian' ? 'inset 0 -1px 0 var(--tx-0)' : 'none' }}
        >
          <button
            type="button"
            onClick={() => onViewChange('liunian')}
            aria-pressed={view === 'liunian'}
            className="flex-1 text-center whitespace-nowrap"
            style={{ minHeight: 44, fontSize: 'var(--fs-small)', color: view === 'liunian' ? 'var(--t-text)' : 'var(--t-text2)', background: 'none', border: 'none' }}
          >
            {t('year')}
          </button>
          {/* 年份 +/- */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label={t('prevYear')}
              onClick={e => { e.stopPropagation(); onYearChange(liunianYear - 1); if (view !== 'liunian') onViewChange('liunian'); }}
              className="flex items-center justify-center"
              style={{ minWidth: 24, minHeight: 44, fontSize: 'var(--fs-body)', color: 'var(--t-text2)', background: 'none', border: 'none' }}
            >
              ‹
            </button>
            <span
              className="tabular-nums min-w-[36px] text-center cursor-pointer"
              style={{ fontSize: 'var(--fs-small)', color: view === 'liunian' ? 'var(--t-text)' : 'var(--t-text2)' }}
              onClick={() => onViewChange('liunian')}
            >
              {liunianYear}
            </span>
            <button
              type="button"
              aria-label={t('nextYear')}
              onClick={e => { e.stopPropagation(); onYearChange(liunianYear + 1); if (view !== 'liunian') onViewChange('liunian'); }}
              className="flex items-center justify-center"
              style={{ minWidth: 24, minHeight: 44, fontSize: 'var(--fs-body)', color: 'var(--t-text2)', background: 'none', border: 'none' }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* 叠加四化说明行 */}
      {overlayInfo && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 mt-1.5 px-1 flex-wrap"
        >
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--t-faint)' }}>
            {view === 'daxian'
              ? t('overlayDecade', { stem: term(overlayInfo.stemName) })
              : t('overlayYear', { year: String(liunianYear), stem: term(overlayInfo.stemName) })}
          </span>
          {(['禄', '权', '科', '忌'] as const).map(sh => {
            const starName = Object.keys(overlayInfo.overlay).find(k => overlayInfo.overlay[k] === sh);
            if (!starName) return null;
            return (
              <span key={sh} style={{ fontSize: 'var(--fs-caption)', color: SIHUA_COLORS[sh] }}>
                {t('transform', { star: term(starName), sihua: term(`化${sh}`) })}
              </span>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex-1 whitespace-nowrap"
      style={{
        minHeight: 44,
        fontSize: 'var(--fs-small)',
        background: 'none',
        border: 'none',
        // 选中 = 正文色 + 底部 1px 线（Polestar 的 tab），不用金色
        color: active ? 'var(--t-text)' : 'var(--t-text2)',
        boxShadow: active ? 'inset 0 -1px 0 var(--tx-0)' : 'none',
      }}
    >
      {children}
    </button>
  );
}
