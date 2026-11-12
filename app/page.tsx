'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import StarField from '@/components/StarField';
import { useTheme, type Theme } from '@/components/ThemeProvider';

// ─── 滚动入场 wrapper ────────────────────────────────────
function FadeIn({
  children, delay = 0, y = 12, className = '',
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.15, 1, 0.35, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WeakBoundary({ line }: { line: string }) {
  // 之前的版本有 1px 实线 + 12px 渐变阴影，主题切换时形成清晰横线很硬。
  // 改为更柔和的 24px 渐变 + 低 opacity，section 衔接更自然。
  return (
    <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${line}, transparent)`, opacity: 0.45 }} />
  );
}

// ─── 主题切换按钮 ────────────────────────────────────────

// ─── 主星数据 ────────────────────────────────────────────
const STARS = [
  { name: '紫微' }, { name: '天机' }, { name: '太阳' }, { name: '武曲' },
  { name: '天同' }, { name: '廉贞' }, { name: '天府' }, { name: '太阴' },
  { name: '贪狼' }, { name: '巨门' }, { name: '天相' }, { name: '天梁' },
  { name: '七杀' }, { name: '破军' },
];

// ─── 功能模块 ────────────────────────────────────────────
// 页面文案都在 messages/<locale>/home.json（#59）；代码里只留 key、状态、图标和样式。
// 列表按下标与 home.json 里的数组一一对应。
type FeatureText = { tag: string; title: string; subtitle: string; points: string[] };

// ─── 4 大学习板块（hero 后时间轴）──────────────────────────
const SECTIONS = [
  {
    key: 'ziwei',
    en: 'Zi Wei',
    status: 'ready' as const,
    icon: '◉',  // 实心圆+内点，紫微星视觉
  },
  {
    key: 'tianji',
    en: 'Tian Ji',
    status: 'soon' as const,
    icon: '⊙',  // 圆+内点（古文"日"），与 ◉ 同字宽
  },
  {
    key: 'diji',
    en: 'Di Ji',
    status: 'soon' as const,
    icon: '⊞',  // 方+井（地/田视觉），与 ⊙ 同字宽
  },
  {
    key: 'renji',
    en: 'Ren Ji',
    status: 'soon' as const,
    icon: '⊕',  // 圆+十字（医道/阴阳调和），与 ⊙/⊞ 同字宽
  },
];
// roadmap.sections：只有带备注的板块才有 note
type SectionText = { name: string; desc: string; when: string; note?: string };

// ─── 倪海厦核心教义 ──────────────────────────────────────
type TeachingText = { title: string; body: string };

// ─── 主题色彩 helper ─────────────────────────────────────
// 设计系统（#57）：颜色全部来自 app/globals.css 的 token，日 / 夜由 data-theme 切换。
// 金色只留给命盘含义；按钮、导航、标签一律单色。
function useColors(_theme: Theme) {
  return {
    bgBase:       'var(--bg-0)',
    navBg:        'var(--bg-0)',
    navBorder:    'var(--bdr)',
    goldGrad:     'linear-gradient(var(--tx-0), var(--tx-0))',
    goldSolid:    'var(--tx-0)',
    goldLine:     'var(--bdr)',
    tagText:      'var(--tx-2)',
    textPrimary:  'var(--tx-0)',
    textSecond:   'var(--tx-1)',
    textMuted:    'var(--tx-2)',
    textFaint:    'var(--tx-3)',
    accent:       'var(--tx-0)',
    accentSoft:   'var(--bg-2)',
    cardBg:       'var(--bg-card)',
    cardBorder:   'var(--bdr)',
    cardShadow:   'var(--sh-sm)',
    featureBg:    'var(--bg-card)',
    featureBord:  'var(--bdr)',
    // 夜空里只留一圈极淡的金色星辉；去掉原来的蓝 / 紫光晕，保持单色
    glowTint:     'var(--ac-glow)',
    glowBlue:     'transparent',
    glowPurple:   'transparent',
    niBg:         'var(--bg-card)',
    niBorder:     'var(--bdr-med)',
    niDivider:    'var(--bdr)',
    niCardBg:     'var(--bg-card)',
    niCardBord:   'var(--bdr)',
    niCardShadow: 'none',
    starBg:       'transparent',
    starBorder:   'var(--bdr-med)',
    starText:     'var(--tx-1)',
    // 主按钮：反白实底（夜里是 Signal White，白天是 Graphite）
    ctaBg:        'var(--tx-0)',
    ctaText:      'var(--bg-0)',
    footerText:   'var(--tx-3)',
    scrollLine:   'var(--bdr-heavy)',
    scrollText:   'var(--tx-3)',
    // 段落之间不再换底色，夜空连续
    altSection:   'transparent',
    quoteBg:      'var(--bg-1)',
  };
}

// ─── 主星 / 四化简介 ──────────────────────────────────────
// home.json 的 stars.<key> / sihua.<key>：name 用在按钮上，heading 是详情卡标题
// （英文版在这里首次给出学术译名，如 "Tanlang (Greedy Wolf)"）。
type BriefText = { name: string; heading: string; attr: string; brief: string };

// ─── 功能视觉装饰 ────────────────────────────────────────
function FeatureVisual({ index, colors: c }: { index: number; colors: ReturnType<typeof useColors> }) {
  const t = useTranslations('home');
  if (index === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5">
        <div className="grid grid-cols-4 gap-1.5 w-72 mx-auto">
          {Array.from({ length: 16 }).map((_, i) => {
            const isCenter = [5, 6, 9, 10].includes(i);
            const isActive = [0, 3, 12, 15].includes(i);
            return (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="h-14 rounded-sm flex items-center justify-center text-xs transition-all duration-300"
                style={{
                  border: `1px solid ${isActive ? c.goldLine : c.cardBorder}`,
                  background: isCenter ? 'transparent' : isActive ? c.starBg : c.featureBg,
                  color: isActive ? c.goldSolid : c.textFaint,
                  opacity: isCenter ? 0 : 1,
                }}>
                {isActive ? '★' : ''}
              </motion.div>
            );
          })}
        </div>
        <p className="text-[12px] transition-colors duration-300"
          style={{ color: c.textFaint }}>{t('visuals.chartCaption')}</p>
      </div>
    );
  }

  if (index === 1) {
    // sel 是选中项在 home.json 里的路径，如 'stars.tanlang'、'sihua.hualu'
    const [sel, setSel] = useState<string | null>(null);
    const selInfo = sel ? (t.raw(sel) as BriefText) : null;
    return (
      <div className="flex flex-col gap-4 h-full justify-center">
        {[
          { group: 'ziwei', stars: ['ziwei', 'tianji', 'taiyang', 'wuqu', 'tiantong', 'lianzhen'] },
          { group: 'tianfu', stars: ['tianfu', 'taiyin', 'tanlang', 'jumen', 'tianxiang', 'tianliang', 'qisha', 'pojun'] },
        ].map(group => (
          <div key={group.group}>
            <div className="text-[12px] mb-2 transition-colors duration-300"
              style={{ color: c.textFaint }}>{t(`visuals.starGroups.${group.group}`)}</div>
            <div className="flex flex-wrap gap-1.5">
              {group.stars.map(key => `stars.${key}`).map(s => (
                <motion.button key={s}
                  onClick={() => setSel(sel === s ? null : s)} whileTap={{ opacity: 0.72 }}
                  transition={{ duration: 0.1 }}
                  className="text-xs px-2 py-1 rounded-md cursor-pointer"
                  style={{
                    border: `1px solid ${sel === s ? c.goldSolid : c.goldLine}`,
                    color: c.goldSolid,
                    background: sel === s ? 'var(--bg-2)' : 'transparent',
                    fontWeight: sel === s ? 600 : 400,
                  }}>
                  {t(`${s}.name`)}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="text-[12px] mb-2 transition-colors duration-300"
            style={{ color: c.textFaint }}>{t('visuals.sihuaLabel')}</div>
          <div className="flex gap-2 flex-wrap">
            {[['sihua.hualu', 'var(--lu)'], ['sihua.huaquan', 'var(--quan)'], ['sihua.huake', 'var(--ke)'], ['sihua.huaji', 'var(--ji)']].map(([label, color]) => (
              <motion.button key={label}
                onClick={() => setSel(sel === label ? null : label)} whileTap={{ opacity: 0.72 }}
                transition={{ duration: 0.1 }}
                className="text-xs px-2.5 py-1 rounded-md cursor-pointer"
                style={{
                  border: `1px solid ${color}`,
                  color,
                  background: sel === label ? `${color.replace('0.7', '0.15')}` : 'transparent',
                  fontWeight: sel === label ? 600 : 400,
                }}>
                {t(`${label}.name`)}
              </motion.button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          {selInfo && (
            <motion.div key={sel}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl p-4 mt-1.5"
              style={{ border: `1px solid ${c.goldLine}`, background: c.featureBg }}>
              {/* flex-wrap：英文标题带译名、标签也更长，窄屏时标签换到下一行 */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold" style={{ color: c.goldSolid }}>{selInfo.heading}</span>
                <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ color: c.tagText, border: `1px solid ${c.goldLine}` }}>{selInfo.attr}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: c.textSecond }}>{selInfo.brief}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (index === 2) {
    const chat = t.raw('visuals.chat') as string[];
    const msgs = [
      { role: 'user', text: chat[0] },
      { role: 'ai', text: chat[1] },
      { role: 'user', text: chat[2] },
    ];
    return (
      <div className="flex flex-col gap-2 h-full justify-center">
        {msgs.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] text-[12px] px-3 py-2 rounded-lg leading-relaxed"
              style={{
                border: `1px solid ${m.role === 'user' ? c.goldLine : c.cardBorder}`,
                background: m.role === 'user' ? c.starBg : c.featureBg,
                color: m.role === 'user' ? c.goldSolid : c.textSecond,
              }}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (index === 3) {
    const patternText = t.raw('visuals.patterns') as { name: string; desc: string }[];
    const patterns = [
      { ...patternText[0], ok: true },
      { ...patternText[1], ok: true },
      { ...patternText[2], ok: false },
    ];
    return (
      <div className="flex flex-col gap-3 h-full justify-center">
        {patterns.map((p, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{
              border: `1px solid ${p.ok ? 'color-mix(in srgb, var(--quan) 28%, transparent)' : 'color-mix(in srgb, var(--ke) 28%, transparent)'}`,
              background: p.ok ? 'color-mix(in srgb, var(--quan) 6%, transparent)' : 'color-mix(in srgb, var(--ke) 6%, transparent)',
            }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: p.ok ? 'var(--quan)' : 'var(--ke)' }} />
            <div>
              <div className="text-[12px] font-medium"
                style={{ color: p.ok ? 'var(--quan)' : 'var(--ke)' }}>{p.name}</div>
              <div className="text-[12px]" style={{ color: c.textMuted }}>{p.desc}</div>
            </div>
          </motion.div>
        ))}
        <div className="text-[12px] mt-2 text-center" style={{ color: c.textFaint }}>
          {t('visuals.patternsCaption')}
        </div>
      </div>
    );
  }

  return null;
}

// ─── 主页 ─────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = useColors(theme);
  const t = useTranslations('home');

  const sectionText = t.raw('roadmap.sections') as SectionText[];
  const sections = SECTIONS.map((s, i) => ({ ...s, ...sectionText[i] }));
  const features = t.raw('features') as FeatureText[];
  const teachings = t.raw('ni.teachings') as TeachingText[];
  const trinityCards = t.raw('trinity.cards') as { glyph: string; label: string; sub: string; desc: string }[];
  // 富文本标签：<phrase> 是 hero 里不拆行的半句，<label> 是生平各段的金色小标题
  const phrase = (chunks: React.ReactNode) => <span className="inline-block">{chunks}</span>;
  const br = () => <br />;
  const bioTags = {
    label: (chunks: React.ReactNode) => <strong style={{ color: c.goldSolid }}>{chunks}</strong>,
    strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    em: (chunks: React.ReactNode) => <em>{chunks}</em>,
  };

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);


  return (
    <div style={{ background: c.bgBase }} className="overflow-x-hidden">
      {/* 致用户公告——首次访问全屏覆盖，关闭后才进入首页 */}

      <StarField />

      {/* 全局光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowTint} 0%, transparent 70%)` }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowBlue} 0%, transparent 70%)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowPurple} 0%, transparent 70%)` }} />
      </div>


      {/* ══ HERO（Polestar 版式，#57）══════════════════════════
          左对齐、贴页边距：展示级标题 → 正文色主张 + 60% 副主张 → 52px 主按钮 + 描边按钮。
          标题在夜里带一圈极淡的金色星辉，是全页唯一的“灵性”点缀。 */}
      <section ref={heroRef} className="relative min-h-[92svh] flex flex-col justify-center z-10"
        style={{ padding: '48px var(--gutter) 96px' }}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="w-full max-w-[1216px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.15, 1, 0.35, 1] }}
            className="mb-6" style={{ fontSize: 'var(--fs-caption)', color: c.textMuted }}>
            {t('hero.eyebrow')}
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.15, 1, 0.35, 1] }}
            className="grad-text grad-text-dark"
            style={{ fontSize: 'var(--fs-display)', lineHeight: 1, fontWeight: 400, letterSpacing: '0.04em' }}>
            {t('hero.title')}
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.15, 1, 0.35, 1] }}
            className="mt-8" style={{ fontSize: 'var(--fs-headline)', lineHeight: 1.25 }}>
            <p style={{ color: c.textPrimary }}>
              {t.rich('hero.claim', { phrase })}
            </p>
            <p style={{ color: c.textMuted }}>
              {t.rich('hero.subclaim', { phrase })}
            </p>
          </motion.div>


          {/* CTA：Polestar 的 52px 按钮，主次分明 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: [0.15, 1, 0.35, 1] }}
            className="mt-10 flex flex-wrap gap-4">
            <button type="button" className="btn-primary" onClick={() => router.push('/chart')}>
              {t('hero.cta')} <span aria-hidden="true">→</span>
            </button>
          </motion.div>

        </motion.div>
      </section>

      {/* ══ 哲学引言 ══════════════════════════════════════ */}
      <section data-theme="dark" className="relative z-10 overflow-hidden min-h-[82svh] lg:min-h-[92vh] flex items-center" style={{ padding: '72px 24px' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="absolute inset-0" style={{ background: 'var(--bg-0)' }} />
        <FadeIn className="relative mx-auto text-center w-full" y={20}>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, var(--bdr))' }} />
            <span className="text-[12px] uppercase" style={{ color: 'var(--tx-3)' }}>{t('outlook.eyebrow')}</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, var(--bdr))' }} />
          </div>
          <div className="space-y-3" style={{ maxWidth: '840px', margin: '0 auto' }}>
            {[
              { text: t('outlook.line1'), size: 'clamp(17px, 2.2vw, 28px)', color: 'var(--tx-2)', delay: 0.1 },
              { text: t('outlook.line2'), size: 'clamp(21px, 2.6vw, 32px)', color: 'var(--tx-2)', delay: 0.25 },
              { text: t('outlook.line3'), size: 'clamp(24px, 3vw, 40px)', color: 'var(--tx-1)', delay: 0.34 },
            ].map((line, i) => (
              <motion.p key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: line.delay }}
                className="" style={{ fontSize: line.size, color: line.color, fontWeight: 400 }}>
                {line.text}
              </motion.p>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="grad-text grad-text-dark font-medium"
              style={{ fontSize: 'clamp(24px, 3.4vw, 48px)', letterSpacing: '0.05em', lineHeight: 1.35 }}>
              {t('outlook.closing')}
            </motion.p>
          </div>
        </FadeIn>
      </section>

      {/* ══ 4 大学习板块时间轴 ════════════════════════════ */}
      <section className="relative z-10 py-20 lg:py-24 px-6"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, var(--bg-1) 50%, transparent 100%)',
        }}>
        <FadeIn className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[12px] uppercase" style={{ color: c.goldSolid, opacity: 0.7 }}>{t('roadmap.eyebrow')}</span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </div>
          <div className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: c.textPrimary }}>
            {t('roadmap.title')}
          </div>
          <div className="text-xs lg:text-sm" style={{ color: c.textMuted }}>
            {t('roadmap.subtitle')}
          </div>
        </FadeIn>

        <div className="max-w-sm lg:max-w-5xl mx-auto relative">
          {/* 横向连接线（仅桌面）*/}
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5"
            style={{
              background: `linear-gradient(90deg, ${c.goldSolid} 0%, ${c.goldSolid} 25%, ${c.goldLine} 25%)`,
              opacity: 0.6,
            }} />

          {/* 纵向连接线（仅手机）—— 圆点贴在线上，做"地铁线路图"风格 */}
          <div className="lg:hidden absolute left-7 top-7 bottom-7 w-px -translate-x-1/2"
            style={{
              background: `linear-gradient(180deg, ${c.goldSolid} 0%, ${c.goldSolid} 22%, ${c.goldLine} 22%)`,
              opacity: 0.6,
            }} />

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-4 lg:gap-4">
            {sections.map((s, i) => {
              const ready = s.status === 'ready';
              return (
                <motion.div key={s.key}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0">
                  {/* 节点：已上线 = 实心；筹备中 = 1px 细环。用序号，不用符号 */}
                  <div className="relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center lg:mb-3 tabular-nums"
                    style={{
                      background: ready ? 'var(--tx-0)' : 'transparent',
                      border: ready ? '1px solid var(--tx-0)' : '1px solid var(--bdr-med)',
                      color: ready ? 'var(--bg-0)' : c.textMuted,
                      fontSize: 'var(--fs-body)',
                    }}>
                    {i + 1}
                  </div>
                  {/* 文字组：手机端右排单列；桌面端居中堆叠 */}
                  <div className="flex-1 lg:flex-none flex flex-col items-start lg:items-center min-w-0">
                    {/* 顶行：时间标签 + 板块名 + note（手机端 inline；桌面端依然分行） */}
                    <div className="flex items-baseline gap-2 lg:flex-col lg:gap-0 lg:mb-1">
                      <div className="text-[12px] lg:mb-1.5"
                        style={{ color: ready ? 'var(--lu)' : c.textMuted, fontWeight: 500 }}>
                        {s.when}
                      </div>
                      <div className="text-base lg:text-xl font-semibold"
                        style={{ color: c.textPrimary }}>
                        {s.name}
                      </div>
                      {s.note && (
                        <div className="text-[12px] px-2 py-0.5 rounded-full lg:hidden"
                          style={{
                            color: c.goldSolid,
                            background: 'var(--bg-1)',
                            border: `1px solid ${c.goldLine}`,
                            opacity: 0.85,
                          }}>
                          {s.note}
                        </div>
                      )}
                    </div>
                    {/* 桌面专属 note（手机已在顶行 inline 展示）*/}
                    {s.note && (
                      <div className="hidden lg:block text-[12px] mb-1.5 px-2 py-0.5 rounded-full"
                        style={{
                          color: c.goldSolid,
                          background: 'var(--bg-1)',
                          border: `1px solid ${c.goldLine}`,
                          opacity: 0.85,
                        }}>
                        {s.note}
                      </div>
                    )}
                    {/* 简介 */}
                    <div className="text-[12px] lg:text-xs leading-relaxed lg:max-w-[200px] mt-0.5 lg:mt-0"
                      style={{ color: c.textSecond }}>
                      {s.desc}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 功能详解 ══════════════════════════════════════ */}
      <section className="relative z-10">
        {features.map((feature, i) => (
          <div key={i}
            className={`flex items-center px-6 md:px-10 lg:px-14 py-20 md:py-24 ${i <= 2 ? 'min-h-[82svh] lg:min-h-[92vh]' : ''}`}
            style={{ background: i % 2 === 1 ? c.altSection : 'transparent' }}>
            <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
              <div className={`grid grid-cols-1 ${i % 2 === 0 ? 'lg:grid-cols-[0.45fr_0.55fr]' : 'lg:grid-cols-[0.55fr_0.45fr]'} gap-10 lg:gap-16 items-start ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                {/* 文字区 */}
                <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <FadeIn delay={0}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px w-8" style={{ background: c.goldLine }} />
                      <span className="text-[12px] uppercase" style={{ color: c.tagText }}>{feature.tag}</span>
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.1}>
                    <h2 className={`grad-text grad-text-dark font-bold leading-tight mb-5`}
                      style={{
                        fontSize: i < 2 ? 'clamp(36px, 4vw, 56px)' : 'clamp(30px, 3.5vw, 48px)',
                        whiteSpace: 'pre-line',
                      }}>
                      {feature.title}
                    </h2>
                  </FadeIn>
                  <FadeIn delay={0.2}>
                    <p className="text-base mb-8 leading-relaxed" style={{ color: c.textSecond }}>{feature.subtitle}</p>
                  </FadeIn>
                  <div className="space-y-4">
                    {feature.points.map((point, j) => (
                      <FadeIn key={j} delay={0.25 + j * 0.08}>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-2 w-1 h-1 rounded-full" style={{ background: c.goldSolid, opacity: 0.6 }} />
                          <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{point}</p>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </div>
                {/* 视觉装饰区 */}
                <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <FadeIn delay={0.15}>
                    <div className="relative rounded-2xl overflow-hidden p-8 md:p-12"
                      style={{
                        border: `1px solid ${c.featureBord}`,
                        background: c.featureBg,
                        minHeight: i <= 1 ? '540px' : i === 2 ? '460px' : '320px',
                        boxShadow: c.cardShadow,
                      }}>
                      <FeatureVisual index={i} colors={c} />
                    </div>
                  </FadeIn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ 天·地·人 三分理论 ════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20"
        style={{ background: c.altSection, minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[12px] uppercase" style={{ color: c.tagText }}>{t('trinity.eyebrow')}</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text grad-text-dark font-bold mb-5`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                {t('trinity.title')}
              </h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: c.textSecond }}>
                {t.rich('trinity.intro', { br })}
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { ...trinityCards[0], pct: '⅓', color: c.goldSolid, borderColor: c.goldLine },
              { ...trinityCards[1], pct: '⅓', color: 'var(--quan)', borderColor: 'color-mix(in srgb, var(--quan) 32%, transparent)' },
              { ...trinityCards[2], pct: '⅓', color: 'var(--lu)', borderColor: 'color-mix(in srgb, var(--lu) 32%, transparent)' },
            ].map((item, i) => (
              <FadeIn key={item.glyph} delay={0.1 + i * 0.12}>
                <motion.div
                  className="rounded-2xl p-7 h-full flex flex-col"
                  style={{ background: c.cardBg, border: `1px solid ${item.borderColor}`, boxShadow: c.cardShadow }}>
                  <div className="flex items-start justify-between mb-5">
                    {/* 中文是单字；英文是整词（Heaven / Humanity），三栏卡片在 md–lg 变窄，字号随之收小以免溢出 */}
                    <div className={`${item.glyph.length > 1 ? 'text-4xl md:text-2xl lg:text-4xl xl:text-5xl' : 'text-5xl'} font-bold leading-none`} style={{ color: item.color }}>{item.glyph}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: item.color }}>{item.pct}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: c.textMuted }}>{t('trinity.ofLife')}</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-0.5" style={{ color: item.color }}>{item.label}</div>
                    <div className="text-[12px]" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                  <div className="h-px mb-4" style={{ background: item.borderColor }} />
                  <p className="text-xs leading-relaxed flex-1" style={{ color: c.textSecond }}>{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div className="mt-10 text-center">
              <p className="text-sm leading-relaxed" style={{ color: c.textSecond }}>
                {t('trinity.quote')}
              </p>
              <p className="mt-2 text-[12px]" style={{ color: c.tagText }}>{t('trinity.attribution')}</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ 倪海厦介绍 ════════════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20" style={{ minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[12px] uppercase" style={{ color: c.tagText }}>{t('ni.eyebrow')}</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text grad-text-dark font-bold mb-6`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                {t('ni.title')}
              </h2>
              <p className="max-w-2xl mx-auto leading-relaxed text-sm" style={{ color: c.textSecond }}>
                {t.rich('ni.intro', { br })}
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl p-8 md:p-10 mb-8"
              style={{ border: `1px solid ${c.niBorder}`, background: c.niBg, boxShadow: c.cardShadow }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {(t.raw('ni.stats') as { label: string; value: string; sub: string }[]).map(item => (
                  <div key={item.label} className="text-center rounded-xl px-4 py-3"
                    style={{ border: `1px solid ${c.niDivider}`, background: 'transparent' }}>
                    <div className="text-[12px] mb-1" style={{ color: c.textFaint }}>{item.label}</div>
                    <div className="text-2xl font-semibold mb-0.5" style={{ color: c.goldSolid }}>{item.value}</div>
                    <div className="text-[12px]" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="h-px mb-8" style={{ background: c.niDivider }} />
              <div className="space-y-4 text-sm leading-relaxed max-w-3xl mx-auto" style={{ color: c.textSecond }}>
                <p>{t.rich('ni.bio.life', bioTags)}</p>
                <p>{t.rich('ni.bio.teaching', bioTags)}</p>
                <p>{t.rich('ni.bio.stance', bioTags)}</p>
                <p>{t.rich('ni.bio.approach', bioTags)}</p>
                <p>{t.rich('ni.bio.influence', bioTags)}</p>
                <p style={{ fontSize: '12px', color: c.textMuted, fontStyle: 'italic', marginTop: '12px' }}>
                  {t('ni.disclaimer')}
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachings.map((teaching, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.08}>
                <motion.div
                  className="rounded-xl p-6 h-full"
                  style={{ border: `1px solid ${c.niCardBord}`, background: c.niCardBg, boxShadow: c.niCardShadow }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5"
                      style={{ borderColor: c.goldLine }}>
                      <span className="text-[12px]" style={{ color: c.goldSolid }}>{i + 1}</span>
                    </div>
                    {/* whitespace-pre-line：英文第一条是两行的英雄双韵体（对仗句），用 \n 分行 */}
                    <h3 className="text-sm font-medium leading-relaxed whitespace-pre-line" style={{ color: c.goldSolid }}>{teaching.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed pl-8" style={{ color: c.textSecond }}>{teaching.body}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 合盘入口 ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-10 lg:px-14 py-20">
        <div className="mx-auto" style={{ maxWidth: '1280px' }}>
          <div className="rounded-2xl p-10 md:p-14 text-center"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${c.cardBorder}`,
              boxShadow: c.cardShadow,
            }}>
            <FadeIn>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-8" style={{ background: c.goldLine }} />
                <span className="text-[12px] uppercase" style={{ color: c.tagText }}>{t('heming.eyebrow')}</span>
                <div className="h-px w-8" style={{ background: c.goldLine }} />
              </div>
              <h2 className={`grad-text grad-text-dark font-bold mb-4`}
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
                {t('heming.title')}
              </h2>
              <p className="text-sm leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: c.textSecond }}>
                {t.rich('heming.desc', { br: () => <br className="hidden md:block" /> })}
              </p>
              <div className="flex justify-center gap-3 flex-wrap mb-6">
                {(t.raw('heming.tags') as string[]).map(item => (
                  <span key={item} style={{
                    fontSize: '12px', padding: '5px 14px', borderRadius: '20px',
                    background: 'var(--bg-1)',
                    border: `1px solid ${c.goldLine}`,
                    color: c.goldSolid,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
              <button type="button" className="btn-ghost" onClick={() => router.push('/heming')}>
                {t('heming.cta')} <span aria-hidden="true">→</span>
              </button>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ 最终 CTA ══════════════════════════════════════ */}
      <section className="relative z-10 py-40 px-6 text-center" style={{ background: c.altSection }}>
        <FadeIn>
          <p className="text-[12px] uppercase mb-6" style={{ color: c.tagText }}>{t('closing.eyebrow')}</p>
          <h2 className={`grad-text grad-text-dark font-bold mb-8 leading-tight`}
            style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}>
            {t.rich('closing.title', { br })}
          </h2>
          <p className="text-sm mb-10 max-w-md mx-auto leading-relaxed" style={{ color: c.textSecond }}>
            {t.rich('closing.desc', { br })}
          </p>
          <button type="button" className="btn-primary" onClick={() => router.push('/chart')}>
            {t('closing.cta')} <span aria-hidden="true">→</span>
          </button>
          <div className="mt-6 flex flex-wrap gap-8 justify-center" style={{ fontSize: 'var(--fs-body)' }}>
            <a href="/knowledge" style={{ color: 'var(--tx-0)' }}>{t('closing.knowledge')} <span aria-hidden="true">→</span></a>
            <a href="/library" style={{ color: 'var(--tx-0)' }}>{t('closing.library')} <span aria-hidden="true">→</span></a>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6"
        style={{ borderTop: `1px solid ${c.niCardBord}` }}>

        {/* 4 板块导航占位（已上线 + 即将开放）*/}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-[12px] text-center mb-4 uppercase"
            style={{ color: c.textMuted, opacity: 0.6 }}>
            {t('footer.label')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {sections.map(s => {
              const ready = s.status === 'ready';
              return (
                <a
                  key={s.key}
                  href={ready ? '/chart' : undefined}
                  onClick={ready ? undefined : (e) => e.preventDefault()}
                  className="rounded-lg px-3 py-3 text-center transition-all"
                  style={{
                    background: ready ? c.starBg : 'transparent',
                    border: `1px ${ready ? 'solid' : 'dashed'} ${ready ? c.goldLine : c.navBorder}`,
                    cursor: ready ? 'pointer' : 'not-allowed',
                    opacity: ready ? 1 : 0.5,
                    textDecoration: 'none',
                  }}
                >
                  <div className="text-base font-semibold mb-0.5"
                    style={{ color: ready ? c.goldSolid : c.textMuted }}>
                    {s.name}
                  </div>
                  <div className="text-[12px]"
                    style={{ color: ready ? 'var(--lu)' : c.textMuted }}>
                    {ready ? `✓ ${t('footer.live')}` : t('footer.opensIn', { when: s.when })}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[12px] mb-3" style={{ color: c.footerText }}>
            {t('footer.tagline')}
          </p>
          <p className="text-[12px] mb-3 max-w-2xl mx-auto leading-relaxed"
            style={{ color: c.footerText, opacity: 0.85 }}>
            {t.rich('footer.disclaimer', { br: () => <br className="sm:hidden" /> })}
          </p>
          <p className="text-[12px]" style={{ color: c.footerText }}>
            <a href="/terms" style={{ color: c.footerText, textDecoration: 'underline' }}>{t('footer.terms')}</a>
            {' · '}
            <a href="/privacy" style={{ color: c.footerText, textDecoration: 'underline' }}>{t('footer.privacy')}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
