'use client';
import { motion } from 'framer-motion';
import type { Palace, Star } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';

/**
 * 一个宫位（#57）：宫名 14、干支 / 年龄 / 辅星 12、主星 16，任何文字都不小于 12px。
 * 颜色只给四化（禄权科忌，总配汉字）和命盘含义（主星、命宫、当前大限用金）；
 * 辅星、煞星一律中性色。主星后面带庙旺亮度，信息不只靠颜色。
 */

interface PalaceCellProps {
  palace: Palace;
  onClick?: () => void;
  onStarClick?: (star: Star) => void;
  isSelected?: boolean;
  isSanFang?: boolean;
  delay?: number;
  /** 叠加四化：星名 → 四化类型（'禄'/'权'/'科'/'忌'） */
  overlayStarSiHua?: Record<string, string>;
  /** 叠加标签：'年'（流年）或 '限'（大限） */
  overlayLabel?: string;
  /** 点击叠加四化 badge 回调 */
  onSiHuaClick?: (starName: string, siHua: string) => void;
}

const SIHUA_COLOR: Record<string, string> = {
  '禄': 'var(--lu)',
  '权': 'var(--quan)',
  '科': 'var(--ke)',
  '忌': 'var(--ji)',
};

/** 四化徽章：颜色 + 汉字；叠加的（大限 / 流年）用虚线框并带“限”“年”标签。 */
function SiHuaBadge({ siHua, overlay, label, onClick }: {
  siHua: string;
  overlay?: boolean;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const style = { color: SIHUA_COLOR[siHua] ?? 'var(--tx-2)', borderStyle: overlay ? 'dashed' : 'solid' } as const;
  const text = `${overlay && label ? label : ''}${siHua}`;
  // 只有真的能点时才是按钮；否则就是一个标签，点击会落到宫位上
  return onClick ? (
    <button type="button" className="sihua-badge ml-1 flex-shrink-0" style={style} onClick={onClick} aria-label={`${label ?? ''}化${siHua}`}>
      {text}
    </button>
  ) : (
    <span className="sihua-badge ml-1 flex-shrink-0" style={style}>{text}</span>
  );
}

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, delay = 0,
  overlayStarSiHua, overlayLabel, onSiHuaClick,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;
  const ganzhi = `${STEMS[stem]}${BRANCHES[branch]}`;

  const majorStars = stars.filter(s => s.type === 'major');
  const auxStars = stars.filter(s => s.type === 'lucky' || s.type === 'sha');

  const overlayClick = (starName: string, siHua: string) =>
    onSiHuaClick ? (e: React.MouseEvent) => { e.stopPropagation(); onSiHuaClick(starName, siHua); } : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.15, 1, 0.35, 1] }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={!!isSelected}
      aria-label={`${name}，${majorStars.length ? majorStars.map(s => s.name).join('、') : '空宫'}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
      }}
      className="relative flex flex-col p-2 cursor-pointer h-full"
      style={{
        minHeight: '112px',
        // 选中 = 1px 正文色描边（界面状态，单色）；当前大限 = 金色左边线（命盘含义）；
        // 三方四正 = 细底；命宫 = 极淡的金底
        background: isSelected
          ? 'var(--bg-2)'
          : isCurrentDaXian
          ? 'var(--ac-bg)'
          : isSanFang
          ? 'var(--bg-1)'
          : isMingGong
          ? 'var(--ac-bg)'
          : 'var(--t-bg)',
        boxShadow: isSelected
          ? `inset 0 0 0 1px var(--tx-0)${isCurrentDaXian ? ', inset 3px 0 0 var(--ac)' : ''}`
          : isCurrentDaXian
          ? 'inset 3px 0 0 var(--ac)'
          : 'none',
      }}
    >
      {/* 宫名 + 命 / 身 + 大限年龄 */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-1">
        <span className="flex items-center gap-1 whitespace-nowrap" style={{ fontSize: 'var(--fs-small)', lineHeight: '18px', color: isMingGong ? 'var(--ac)' : 'var(--tx-0)' }}>
          {name}
          {isMingGong && <span className="sihua-badge" style={{ color: 'var(--ac)' }}>命</span>}
          {isShenGong && <span className="sihua-badge" style={{ color: 'var(--tx-0)' }}>身</span>}
        </span>
        {daXianAge && (
          <span className="tabular-nums flex-shrink-0" style={{ fontSize: 'var(--fs-caption)', color: isCurrentDaXian ? 'var(--ac)' : 'var(--tx-2)' }}>
            {daXianAge[0]}–{daXianAge[1]}
          </span>
        )}
      </div>

      {/* 干支 */}
      <div className="mb-1" style={{ fontSize: 'var(--fs-caption)', lineHeight: '16px', color: 'var(--tx-2)' }}>{ganzhi}</div>

      {/* 主星：16px 金，后面跟庙旺与四化 */}
      <div className="flex flex-col gap-1 flex-1">
        {majorStars.length === 0 && (
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
            空宫{palace.borrowedStars?.length ? `（借${palace.borrowedStars.join('、')}）` : ''}
          </span>
        )}
        {majorStars.map((star) => {
          const overlaySiHua = overlayStarSiHua?.[star.name];
          const starName = (
            <span style={{ fontSize: 'var(--fs-body)', lineHeight: '20px', color: 'var(--ac)' }}>{star.name}</span>
          );
          return (
            <div key={star.name} className="flex items-center flex-wrap">
              {onStarClick ? (
                <button type="button" onClick={e => { e.stopPropagation(); onStarClick(star); }} style={{ background: 'none', border: 'none', padding: 0 }}>
                  {starName}
                </button>
              ) : starName}
              {star.brightnessRaw && (
                <span className="ml-1" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{star.brightnessRaw}</span>
              )}
              {star.siHua && <SiHuaBadge siHua={star.siHua} />}
              {overlaySiHua && (
                <SiHuaBadge siHua={overlaySiHua} overlay label={overlayLabel} onClick={overlayClick(star.name, overlaySiHua)} />
              )}
            </div>
          );
        })}
      </div>

      {/* 辅星（吉星 / 煞星）：12px 中性色；只有四化带颜色 */}
      {auxStars.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5 mt-1" style={{ fontSize: 'var(--fs-caption)', lineHeight: '16px', color: 'var(--tx-2)' }}>
          {auxStars.map(s => {
            const overlaySiHua = overlayStarSiHua?.[s.name];
            return (
              <span key={s.name} className="inline-flex items-center">
                {s.name}
                {s.siHua && <SiHuaBadge siHua={s.siHua} />}
                {overlaySiHua && (
                  <SiHuaBadge siHua={overlaySiHua} overlay label={overlayLabel} onClick={overlayClick(s.name, overlaySiHua)} />
                )}
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
