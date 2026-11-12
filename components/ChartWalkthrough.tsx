/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The home page's chart walkthrough (overdrive direction 1, approved motion 5).
 * A sample chart, worked out in the browser by the engine from a made-up birthday, stays
 * pinned while four steps scroll past: the Life Palace, its sanfang sizheng, the birth-year
 * Four Transformations, and the decade the person is in now. Each step lights its palaces;
 * the rest dim. The board is the chart page's own PalaceCell and SanFangLines, so it looks
 * exactly like /chart. Below 1024px it stacks, unpinned, with every highlight shown at once.
 */

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { generateChart } from '@/lib/ziwei/algorithm';
import { BRANCH_GRID_POS, getSanFangSiZheng } from '@/lib/ziwei/board-layout';
import { termLabel } from '@/lib/i18n/glossary';
import PalaceCell from './PalaceCell';
import SanFangLines from './SanFangLines';

// A made-up birthday (the same synthetic data the tests use), never a real person.
const SAMPLE = { year: 1990, month: 6, day: 15, hour: 6, gender: 'female' } as const;
const STEPS = ['ming', 'sanfang', 'sihua', 'daxian'] as const;
type Step = (typeof STEPS)[number];
/** On narrow screens the board isn't pinned, so it shows every step's highlight at once. */
type View = Step | 'all';

export default function ChartWalkthrough() {
  // The home namespace holds arrays, which next-intl's namespace typing doesn't descend into,
  // so this reads home and prefixes its own keys, as the home page does.
  const home = useTranslations('home');
  const t = (key: string, values?: Record<string, string | number>) => home(`walkthrough.${key}` as Parameters<typeof home>[0], values as never);
  const locale = useLocale();
  const chart = useMemo(() => generateChart(SAMPLE), []);
  const [view, setView] = useState<View>('ming');
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    let io: IntersectionObserver | null = null;
    const apply = () => {
      io?.disconnect();
      if (!wide.matches) { setView('all'); return; }
      setView('ming');
      // The step crossing the middle band of the screen is the one being read.
      io = new IntersectionObserver((entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setView((hit.target as HTMLElement).dataset.step as Step);
      }, { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.5, 1] });
      stepRefs.current.forEach((el) => el && io!.observe(el));
    };
    apply();
    wide.addEventListener('change', apply);
    return () => { io?.disconnect(); wide.removeEventListener('change', apply); };
  }, []);

  const ming = chart.mingGongBranch;
  const sanfang = new Set(getSanFangSiZheng(ming));
  const sihua = new Set(chart.palaces.filter((p) => p.stars.some((s) => s.siHua)).map((p) => p.branch));
  const decadePalace = chart.palaces.find((p) => p.isCurrentDaXian);
  const decade = chart.daXians[chart.currentDaXianIndex];
  // The decade's palace, and the opposite one it borrows stars from when it has no main star.
  const decadeSet = new Set(decadePalace ? [decadePalace.branch, (decadePalace.branch + 6) % 12] : []);
  const lit = (branch: number) =>
    view === 'all' ? true
      : view === 'ming' ? branch === ming
      : view === 'sanfang' ? sanfang.has(branch)
      : view === 'sihua' ? sihua.has(branch)
      : decadeSet.has(branch);
  const showLines = view === 'sanfang' || view === 'all';
  const ages = { age: chart.currentAge, start: decade?.startAge ?? 0, end: decade?.endAge ?? 0 };
  const centerKey: Step = view === 'all' ? 'ming' : view;

  return (
    <section aria-labelledby="walkthrough-title" className="page relative z-10" style={{ paddingTop: 96, paddingBottom: 96 }}>
      <header style={{ maxWidth: 720 }}>
        <h2 id="walkthrough-title" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t('title')}</h2>
        <p className="mt-3" style={{ color: 'var(--tx-2)' }}>{t('lead')}</p>
        <p className="mt-2" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t('note')}</p>
      </header>

      <div className="mt-12 grid gap-12 lg:gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* The board is a picture of what the steps say; the steps carry the content for screen readers. */}
        <div className="lg:sticky self-start" style={{ top: 'calc(var(--nav-h) + 24px)' }} aria-hidden="true" inert>
          <div className="grid relative"
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridTemplateRows: 'repeat(4, auto)', gap: '1px', background: 'var(--t-border)', border: '1px solid var(--t-border)' }}>
            {chart.palaces.map((palace) => {
              const [row, col] = BRANCH_GRID_POS[palace.branch];
              return (
                <div key={palace.branch}
                  style={{ gridRow: row, gridColumn: col, background: 'var(--t-bg)', opacity: lit(palace.branch) ? 1 : 0.3, transition: 'opacity var(--dur-1) linear' }}>
                  <PalaceCell
                    palace={palace}
                    isSelected={(view === 'ming' || view === 'sanfang' || view === 'all') && palace.branch === ming}
                    isSanFang={showLines && sanfang.has(palace.branch) && palace.branch !== ming}
                  />
                </div>
              );
            })}
            <div className="flex flex-col items-center justify-center gap-3 p-4 text-center"
              style={{ gridRow: '2 / 4', gridColumn: '2 / 4', background: 'var(--t-bg)' }}>
              <span aria-hidden="true" className="pole-mark" />
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--tx-0)' }}>{t(`center.${centerKey}`, ages)}</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>
                {t('centerMeta', { ju: termLabel(chart.wuxingJuName, locale), lord: termLabel(chart.mingZhu ?? '', locale) })}
              </p>
            </div>
            <AnimatePresence>
              {showLines && (
                <motion.div key="sanfang" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="pointer-events-none" style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
                  <SanFangLines branch={ming} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ol className="grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {STEPS.map((step, i) => (
            <li key={step} data-step={step} ref={(el) => { stepRefs.current[i] = el; }}
              className="lg:min-h-[70vh] pb-12 lg:pb-0"
              style={{ opacity: view === 'all' || view === step ? 1 : 0.4, transition: 'opacity var(--dur-1) linear' }}>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t(`steps.${step}.label`)}</p>
              <h3 className="mt-2" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25, color: 'var(--tx-0)' }}>{t(`steps.${step}.title`)}</h3>
              <p className="mt-4" style={{ fontSize: 'var(--fs-read)', lineHeight: 'var(--lh-read)', color: 'var(--tx-1)' }}>{t(`steps.${step}.body`, ages)}</p>
              <p className="mt-3" style={{ fontSize: 'var(--fs-caption)', color: 'var(--tx-2)' }}>{t(`steps.${step}.basis`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
