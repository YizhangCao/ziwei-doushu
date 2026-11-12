'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';
import PalaceCell from './PalaceCell';
import TimeNav, { type TimeView, getYearStemIndex, buildSiHuaOverlay } from './TimeNav';

interface ChartBoardProps {
  chart: ZiweiChart;
  onStarSelect?: (star: Star, palace: Palace) => void;
  onPalaceSelect?: (palace: Palace) => void;
  onSiHuaClick?: (starName: string, siHua: string, view: TimeView) => void;
}

const BRANCH_GRID_POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

// 每个地支宫位在网格中的中心坐标（百分比）
const BRANCH_SVG_POS: Record<number, [number, number]> = {
  5: [12.5, 12.5], 6: [37.5, 12.5], 7: [62.5, 12.5], 8: [87.5, 12.5],
  4: [12.5, 37.5],                                      9: [87.5, 37.5],
  3: [12.5, 62.5],                                     10: [87.5, 62.5],
  2: [12.5, 87.5], 1: [37.5, 87.5], 0: [62.5, 87.5], 11: [87.5, 87.5],
};

// 绕盘面顺时针排列（用于三方四正四边形排序）
const CLOCKWISE_INDEX: Record<number, number> = {
  5: 0, 6: 1, 7: 2, 8: 3,
  9: 4, 10: 5,
  11: 6, 0: 7, 1: 8, 2: 9,
  3: 10, 4: 11,
};

function sortClockwise(branches: number[]): number[] {
  return [...branches].sort((a, b) => CLOCKWISE_INDEX[a] - CLOCKWISE_INDEX[b]);
}

/** 三方四正：本宫 + 对宫 + 两个三合宫 */
function getSanFangSiZheng(branch: number): [number, number, number, number] {
  return [
    branch,
    (branch + 6) % 12,   // 对宫
    (branch + 4) % 12,   // 三合1
    (branch + 8) % 12,   // 三合2
  ];
}

const ANIMATION_ORDER = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

export default function ChartBoard({ chart, onStarSelect, onPalaceSelect, onSiHuaClick }: ChartBoardProps) {
  // 起盘后默认选中命宫：三方四正的连线立刻画出来，读者一眼就有了落脚点（不触发 AI 解读）
  const [selectedBranch, setSelectedBranch] = useState<number | null>(chart.mingGongBranch);
  const [timeView, setTimeView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState<number>(new Date().getFullYear());

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
  const overlayLabel = timeView === 'daxian' ? '限' : timeView === 'liunian' ? '年' : undefined;

  const handlePalaceClick = (branch: number) => {
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
  const mingStars = mingGong?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
  const mingDesc = mingStars.length > 0
    ? `坐${mingStars.join('、')}`
    : `空宫（借对宫${mingGong?.borrowedStars?.length ? ' ' + mingGong.borrowedStars.join('、') : ''}）`;
  const title = chart.birthInfo.name ? `${chart.birthInfo.name}的命盘` : '你的命盘';

  // 600ms 由起点画向终点，缓出（与全站进场一致）
  const draw = { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 0.6, ease: [0.15, 1, 0.35, 1] as const } };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h2 style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{title}</h2>
        <p className="mt-2" style={{ fontSize: 'var(--fs-read)', lineHeight: 'var(--lh-read)', color: 'var(--tx-1)' }}>
          你的命宫在{BRANCHES[chart.mingGongBranch]}，{mingDesc}。
          <span style={{ color: 'var(--tx-2)' }}>点击任一宫位，查看它的三方四正。</span>
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
        aria-label="命盘"
        className="grid relative select-none mt-4"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, auto)',
          gap: '1px',
          background: 'var(--t-border)',
          border: '1px solid var(--t-border)',
        }}
      >
        {ANIMATION_ORDER.map((branch, i) => {
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
                delay={i * 0.04}
                overlayStarSiHua={Object.keys(overlayData).length > 0 ? overlayData : undefined}
                overlayLabel={overlayLabel}
                onSiHuaClick={onSiHuaClick ? (starName, siHua) => onSiHuaClick(starName, siHua, timeView) : undefined}
              />
            </div>
          );
        })}

        {/* 中央：北辰记号 + 命盘要素 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.15, 1, 0.35, 1] }}
          className="flex flex-col items-center justify-center p-4 gap-4 text-center"
          style={{ gridRow: '2 / 4', gridColumn: '2 / 4', background: 'var(--t-bg)' }}
        >
          <span aria-hidden="true" className="pole-mark" />

          <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-left" style={{ fontSize: 'var(--fs-caption)', lineHeight: '18px' }}>
            <dt style={{ color: 'var(--tx-2)' }}>命宫</dt>
            <dd style={{ color: 'var(--ac)' }}>{BRANCHES[chart.mingGongBranch]}</dd>
            <dt style={{ color: 'var(--tx-2)' }}>身宫</dt>
            <dd style={{ color: 'var(--tx-0)' }}>{BRANCHES[chart.shenGongBranch]}</dd>
            <dt style={{ color: 'var(--tx-2)' }}>五行局</dt>
            <dd style={{ color: 'var(--tx-0)' }}>{chart.wuxingJuName}</dd>
          </dl>

          {chart.currentDaXianIndex >= 0 && (() => {
            const dx = chart.daXians[chart.currentDaXianIndex];
            return (
              <div className="px-3 py-2" style={{ border: '1px solid var(--ac-bdr)' }}>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>当前大限</div>
                <div className="tabular-nums" style={{ fontSize: 'var(--fs-body)', color: 'var(--ac)' }}>{dx.startAge}–{dx.endAge} 岁</div>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{dx.palaceName}</div>
              </div>
            );
          })()}

          <div className="tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
            农历 {chart.lunarInfo.lunarYear}·{chart.lunarInfo.isLeapMonth ? '闰' : ''}
            {chart.lunarInfo.lunarMonth}·{chart.lunarInfo.lunarDay}
          </div>
        </motion.div>

        {/* ── 三方四正：1px 金线，600ms 画出；四个宫位中心各一个点 ── */}
        <AnimatePresence>
          {sanFangBranches !== null && (
            <motion.div
              key={`sf-${selectedBranch}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none"
              style={{ position: 'absolute', inset: 0, zIndex: 20 }}
            >
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} aria-hidden="true">
                {(() => {
                  const p0 = BRANCH_SVG_POS[sanFangBranches[0]]; // 本宫
                  const p1 = BRANCH_SVG_POS[sanFangBranches[1]]; // 对宫
                  const p2 = BRANCH_SVG_POS[sanFangBranches[2]]; // 三合1
                  const p3 = BRANCH_SVG_POS[sanFangBranches[3]]; // 三合2
                  const line = { style: { stroke: 'var(--ac)' }, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const };
                  return (
                    <>
                      {/* 对宫直线（穿过中心）+ 三合三角形 */}
                      <motion.line x1={`${p0[0]}%`} y1={`${p0[1]}%`} x2={`${p1[0]}%`} y2={`${p1[1]}%`} {...line} {...draw} />
                      <motion.line x1={`${p0[0]}%`} y1={`${p0[1]}%`} x2={`${p2[0]}%`} y2={`${p2[1]}%`} {...line} {...draw} />
                      <motion.line x1={`${p2[0]}%`} y1={`${p2[1]}%`} x2={`${p3[0]}%`} y2={`${p3[1]}%`} {...line} {...draw} />
                      <motion.line x1={`${p3[0]}%`} y1={`${p3[1]}%`} x2={`${p0[0]}%`} y2={`${p0[1]}%`} {...line} {...draw} />
                      {[p0, p1, p2, p3].map((p, i) => (
                        <circle key={i} cx={`${p[0]}%`} cy={`${p[1]}%`} r={i === 0 ? 3 : 2.5} style={{ fill: 'var(--ac)' }} />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
