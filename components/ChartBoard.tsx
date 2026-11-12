'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { termLabel } from '@/lib/i18n/glossary';
import { formatList } from '@/lib/i18n/format';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';
import PalaceCell from './PalaceCell';
import SanFangLines from './SanFangLines';
import { BRANCH_GRID_POS, getSanFangSiZheng, placementOrder } from '@/lib/ziwei/board-layout';
import { chartReveal } from '@/lib/design/chart-reveal';
import TimeNav, { type TimeView, getYearStemIndex, buildSiHuaOverlay } from './TimeNav';

interface ChartBoardProps {
  chart: ZiweiChart;
  onStarSelect?: (star: Star, palace: Palace) => void;
  onPalaceSelect?: (palace: Palace) => void;
  onSiHuaClick?: (starName: string, siHua: string, view: TimeView) => void;
}

export default function ChartBoard({ chart, onStarSelect, onPalaceSelect, onSiHuaClick }: ChartBoardProps) {
  const t = useTranslations('board');
  const locale = useLocale();
  // 起盘后默认选中命宫：三方四正的连线立刻画出来，读者一眼就有了落脚点（不触发 AI 解读）
  const [selectedBranch, setSelectedBranch] = useState<number | null>(chart.mingGongBranch);
  const [timeView, setTimeView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState<number>(new Date().getFullYear());
  // 起盘揭示（#86）：命宫先出，其余十一宫按排盘顺序逆时针依次出现，再画命宫的三方四正，
  // 最后落下当前大限的金边。只在起盘时一次；读者一点宫位，线就立即画。
  const reveal = chartReveal(!!useReducedMotion());
  const revealing = useRef(true);

  const palaceMap: Record<number, Palace> = {};
  chart.palaces.forEach(p => { palaceMap[p.branch] = p; });

  // 计算当前叠加四化数据（大限或流年）
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const overlayData: Record<string, string> = (() => {
    if (timeView === 'daxian' && currentDx) {
      const dxPalace = chart.palaces.find(p => p.branch === currentDx.palaceBranch);
      if (dxPalace) return buildSiHuaOverlay(dxPalace.stem);
    }
    if (timeView === 'liunian') {
      return buildSiHuaOverlay(getYearStemIndex(liunianYear));
    }
    return {};
  })();
  const overlayLabel = timeView === 'daxian' ? t('overlay.daxian') : timeView === 'liunian' ? t('overlay.liunian') : undefined;

  const handlePalaceClick = (branch: number) => {
    revealing.current = false;
    const isDeselecting = selectedBranch === branch;
    setSelectedBranch(prev => prev === branch ? null : branch);
    if (!isDeselecting) {
      const palace = palaceMap[branch];
      if (palace) onPalaceSelect?.(palace);
    }
  };

  // 三方四正
  const sanFangBranches = selectedBranch !== null ? getSanFangSiZheng(selectedBranch) : null;
  const sanFangSet = sanFangBranches ? new Set(sanFangBranches) : null;

  // 命宫一句话：落脚点 + 唯一的操作提示
  const mingGong = palaceMap[chart.mingGongBranch];
  const term = (zh: string) => termLabel(zh, locale);
  const mingStars = mingGong?.stars.filter(s => s.type === 'major').map(s => term(s.name)) ?? [];
  const borrowed = mingGong?.borrowedStars?.map(term) ?? [];
  const mingDesc = mingStars.length > 0
    ? t('withStars', { stars: formatList(mingStars, locale) })
    : borrowed.length ? t('emptyBorrowed', { stars: formatList(borrowed, locale) }) : t('empty');
  const title = chart.birthInfo.name ? t('titleNamed', { name: chart.birthInfo.name }) : t('title');

  return (
    <div className="w-full">
      <header className="mb-6">
        <h2 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{title}</h2>
        <p className="mt-2" style={{ fontSize: 'var(--fs-read)', lineHeight: 'var(--lh-read)', color: 'var(--tx-1)' }}>
          {t('lead', { branch: term(BRANCHES[chart.mingGongBranch]), desc: mingDesc })}
          {locale === 'en' && ' '}
          <span style={{ color: 'var(--tx-2)' }}>{t('hint')}</span>
        </p>
      </header>

      {/* 时间导航轴（全页只有这一条） */}
      <TimeNav
        chart={chart}
        view={timeView}
        liunianYear={liunianYear}
        onViewChange={setTimeView}
        onYearChange={setLiunianYear}
      />

      {/* 4x4 命盘网格（含 SVG 叠加层） */}
      <section
        aria-label={t('region')}
        className="grid relative select-none mt-4"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, auto)',
          gap: '1px',
          background: 'var(--t-border)',
          border: '1px solid var(--t-border)',
        }}
      >
        {placementOrder(chart.mingGongBranch).map((branch, k) => {
          const [row, col] = BRANCH_GRID_POS[branch];
          const palace = palaceMap[branch];
          if (!palace) return null;
          return (
            <div key={branch} style={{ gridRow: row, gridColumn: col, background: 'var(--t-bg)' }}>
              <PalaceCell
                palace={palace}
                onClick={() => handlePalaceClick(branch)}
                onStarClick={onStarSelect ? (star) => onStarSelect(star, palace) : undefined}
                isSelected={selectedBranch === branch}
                isSanFang={!!(sanFangSet?.has(branch) && selectedBranch !== branch)}
                delay={reveal.palace(k)}
                edgeDelay={reveal.decade}
                overlayStarSiHua={Object.keys(overlayData).length > 0 ? overlayData : undefined}
                overlayLabel={overlayLabel}
                overlayKey={`${timeView}-${liunianYear}`}
                onSiHuaClick={onSiHuaClick ? (starName, siHua) => onSiHuaClick(starName, siHua, timeView) : undefined}
              />
            </div>
          );
        })}

        {/* 中央：北辰记号 + 命盘要素 */}
        <motion.div
          initial={reveal.duration ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: reveal.lines, duration: reveal.duration, ease: [0.15, 1, 0.35, 1] }}
          className="flex flex-col items-center justify-center p-4 gap-4 text-center"
          style={{ gridRow: '2 / 4', gridColumn: '2 / 4', background: 'var(--t-bg)' }}
        >
          <span aria-hidden="true" className="pole-mark" />

          <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-left" style={{ fontSize: 'var(--fs-caption)', lineHeight: '18px' }}>
            <dt style={{ color: 'var(--tx-2)' }}>{t('summary.life')}</dt>
            <dd style={{ color: 'var(--ac)' }}>{term(BRANCHES[chart.mingGongBranch])}</dd>
            <dt style={{ color: 'var(--tx-2)' }}>{t('summary.body')}</dt>
            <dd style={{ color: 'var(--tx-0)' }}>{term(BRANCHES[chart.shenGongBranch])}</dd>
            <dt style={{ color: 'var(--tx-2)' }}>{t('summary.ju')}</dt>
            <dd style={{ color: 'var(--tx-0)' }}>{term(chart.wuxingJuName)}</dd>
          </dl>

          {chart.currentDaXianIndex >= 0 && (() => {
            const dx = chart.daXians[chart.currentDaXianIndex];
            return (
              <div className="px-3 py-2" style={{ border: '1px solid var(--ac-bdr)' }}>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('summary.currentDecade')}</div>
                <div className="tabular-nums" style={{ fontSize: 'var(--fs-body)', color: 'var(--ac)' }}>{t('summary.ages', { start: dx.startAge, end: dx.endAge })}</div>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{term(dx.palaceName)}</div>
              </div>
            );
          })()}

          <div className="tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
            {t('summary.lunar', {
              year: String(chart.lunarInfo.lunarYear),
              leap: chart.lunarInfo.isLeapMonth ? t('summary.leap') : '',
              month: String(chart.lunarInfo.lunarMonth),
              day: String(chart.lunarInfo.lunarDay),
            })}
          </div>
        </motion.div>

        {/* ── 三方四正：1px 金线，600ms 画出；四个宫位中心各一个点 ── */}
        <AnimatePresence>
          {sanFangBranches !== null && (
            <motion.div
              key={`sf-${selectedBranch}`}
              initial={reveal.duration ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reveal.duration ? 0.2 : 0 }}
              className="pointer-events-none"
              style={{ position: 'absolute', inset: 0, zIndex: 20 }}
            >
              <SanFangLines branch={sanFangBranches[0]} delay={revealing.current ? reveal.lines : 0} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
