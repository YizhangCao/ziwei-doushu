'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import type { Palace, Star } from '@/lib/ziwei/types';
import { ganzhiLabel, termLabel } from '@/lib/i18n/glossary';
import { formatList } from '@/lib/i18n/format';

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
  /** When the cell starts to fade in, in seconds (the chart reveal, #86). */
  delay?: number;
  /** When the current decade's gold edge starts to fade in; defaults to the cell's own delay. */
  edgeDelay?: number;
  /** 叠加四化：星名 → 四化类型（'禄'/'权'/'科'/'忌'） */
  overlayStarSiHua?: Record<string, string>;
  /** 叠加标签：'年'（流年）或 '限'（大限） */
  overlayLabel?: string;
  /** 点击叠加四化 badge 回调 */
  onSiHuaClick?: (starName: string, siHua: string) => void;
  /** 当前叠加的时间层（如 liunian-2026）：换层时新的四化标记淡入 */
  overlayKey?: string;
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
  const locale = useLocale();
  const style = { color: SIHUA_COLOR[siHua] ?? 'var(--tx-2)', borderStyle: overlay ? 'dashed' : 'solid' } as const;
  // English badges stay short ("Lu"): the dashed border and the time tabs already say which layer it is (#59)
  const text = locale === 'en' ? termLabel(siHua, locale) : `${overlay && label ? label : ''}${siHua}`;
  const aria = locale === 'en'
    ? [label, termLabel(`化${siHua}`, locale)].filter(Boolean).join(' ')
    : `${label ?? ''}化${siHua}`;
  // 只有真的能点时才是按钮；否则就是一个标签，点击会落到宫位上
  return onClick ? (
    <button type="button" className="sihua-badge ml-1 flex-shrink-0" style={style} onClick={onClick} aria-label={aria}>
      {text}
    </button>
  ) : (
    <span className="sihua-badge ml-1 flex-shrink-0" style={style}>{text}</span>
  );
}

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, delay = 0, edgeDelay = delay,
  overlayStarSiHua, overlayLabel, onSiHuaClick, overlayKey,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;
  // Under reduced motion the cell and its edge are simply there (DESIGN.md).
  const reduced = useReducedMotion();
  const reveal = (start: number) => ({
    initial: reduced ? false : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, delay: start, ease: [0.15, 1, 0.35, 1] as const },
  });
  const t = useTranslations('board.palace');
  const locale = useLocale();
  const term = (zh: string) => termLabel(zh, locale);
  const ganzhi = ganzhiLabel(stem, branch, locale);

  const majorStars = stars.filter(s => s.type === 'major');
  const auxStars = stars.filter(s => s.type === 'lucky' || s.type === 'sha');

  // 换时间层（本命/大限/流年、上一年/下一年）时，新的叠加四化在 200ms 内淡入，读者看得出哪里变了
  const overlayBadge = (starName: string, siHua: string) => (
    <motion.span
      key={`${overlayKey}-${starName}-${siHua}`}
      className="inline-flex"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.15, 1, 0.35, 1] }}
    >
      <SiHuaBadge siHua={siHua} overlay label={overlayLabel} onClick={overlayClick(starName, siHua)} />
    </motion.span>
  );

  const overlayClick = (starName: string, siHua: string) =>
    onSiHuaClick ? (e: React.MouseEvent) => { e.stopPropagation(); onSiHuaClick(starName, siHua); } : undefined;

  return (
    <motion.div
      {...reveal(delay)}
      data-palace={name}
      data-branch={branch}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={!!isSelected}
      aria-label={t('aria', { name: term(name), stars: majorStars.length ? formatList(majorStars.map(s => term(s.name)), locale) : t('empty') })}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
      }}
      className="relative flex flex-col p-2 cursor-pointer h-full"
      style={{
        minHeight: '112px',
        // 选中 = 1px 正文色描边（界面状态，单色）；当前大限 = 金色左边线（命盘含义，下方单独一层）；
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
        boxShadow: isSelected ? 'inset 0 0 0 1px var(--tx-0)' : 'none',
      }}
    >
      {/* 当前大限的 3px 金边：单独一层，起盘时最后落下（#86） */}
      {isCurrentDaXian && (
        <motion.span
          {...reveal(edgeDelay)}
          aria-hidden="true"
          data-decade-edge
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{ width: 3, background: 'var(--ac)' }}
        />
      )}

      {/* 宫名 + 命 / 身 + 大限年龄 */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-1">
        <span className="flex items-center gap-1 whitespace-nowrap" style={{ fontSize: 'var(--fs-small)', lineHeight: '18px', color: isMingGong ? 'var(--ac)' : 'var(--tx-0)' }}>
          {term(name)}
          {/* In English the palace is already named "Life" (and gold), so a "Life" badge would repeat it */}
          {isMingGong && locale !== 'en' && <span className="sihua-badge" style={{ color: 'var(--ac)' }}>{t('lifeBadge')}</span>}
          {isShenGong && <span className="sihua-badge" style={{ color: 'var(--tx-0)' }}>{t('bodyBadge')}</span>}
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
            {palace.borrowedStars?.length
              ? t('emptyBorrowed', { stars: formatList(palace.borrowedStars.map(term), locale) })
              : t('empty')}
          </span>
        )}
        {majorStars.map((star) => {
          const overlaySiHua = overlayStarSiHua?.[star.name];
          const starName = (
            <span style={{ fontSize: 'var(--fs-body)', lineHeight: '20px', color: 'var(--ac)' }}>{term(star.name)}</span>
          );
          return (
            <div key={star.name} className="flex items-center flex-wrap">
              {onStarClick ? (
                <button type="button" onClick={e => { e.stopPropagation(); onStarClick(star); }} style={{ background: 'none', border: 'none', padding: 0 }}>
                  {starName}
                </button>
              ) : starName}
              {star.brightnessRaw && (
                <span className="ml-1" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{term(star.brightnessRaw)}</span>
              )}
              {star.siHua && <SiHuaBadge siHua={star.siHua} />}
              {overlaySiHua && (
                overlayBadge(star.name, overlaySiHua)
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
                {term(s.name)}
                {s.siHua && <SiHuaBadge siHua={s.siHua} />}
                {overlaySiHua && (
                  overlayBadge(s.name, overlaySiHua)
                )}
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
