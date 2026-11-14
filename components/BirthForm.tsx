'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { termLabel } from '@/lib/i18n/glossary';
import { placeLabel } from '@/lib/i18n/places-en';
import type { BirthInfo } from '@/lib/ziwei/types';
import { SHICHEN } from '@/lib/ziwei/constants';
import { PROVINCES } from '@/lib/ziwei/cities';

export interface BirthFormState {
  name: string;
  year: string;
  month: string;
  day: string;
  clockHour: string;
  clockMinute: string;
  unknownTime: boolean;
  province: string;
  city: string;
  longitude: number;
  gender: 'male' | 'female';
}

interface BirthFormProps {
  onSubmit: (info: BirthInfo) => void;
  loading?: boolean;
  initialData?: Partial<BirthFormState>;
  onFormSave?: (data: BirthFormState) => void;
  /** 隐藏内部「起盘」按钮（合盘等场景由父级统一触发） */
  hideSubmit?: boolean;
  /** 不画自己的外框（嵌在合盘页的卡片里时用，避免双层边框） */
  bare?: boolean;
}

const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 根据北京时间 + 经度计算真太阳时时辰支 (0-11) */
function calcTrueSolarBranch(clockHour: number, clockMinute: number, longitude: number): number {
  const clockMins = clockHour * 60 + clockMinute;
  const offset = (longitude - 120) * 4;
  const solar = ((clockMins + offset) % 1440 + 1440) % 1440;
  if (solar >= 1380 || solar < 60) return 0;
  return Math.floor((solar - 60) / 120) + 1;
}

/** 检查日期是否合法 */
function isValidDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function BirthForm({ onSubmit, loading, initialData, onFormSave, hideSubmit, bare }: BirthFormProps) {
  const t = useTranslations('birthForm');
  const locale = useLocale();

  const [form, setForm] = useState<BirthFormState>({
    name: initialData?.name ?? '',
    year: initialData?.year ?? '',
    month: initialData?.month ?? '',
    day: initialData?.day ?? '',
    clockHour: initialData?.clockHour ?? '8',
    clockMinute: initialData?.clockMinute ?? '0',
    unknownTime: initialData?.unknownTime ?? false,
    province: initialData?.province ?? '',
    city: initialData?.city ?? '',
    longitude: initialData?.longitude ?? 120,
    gender: initialData?.gender ?? 'male',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // 表单状态变化时实时同步给父级（合盘等场景下父级靠这个收集双方数据）
  useEffect(() => {
    onFormSave?.({ ...form });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const cityList = useMemo(() => {
    const prov = PROVINCES.find(p => p.name === form.province);
    return prov ? prov.cities : [];
  }, [form.province]);

  const branch = useMemo(() => {
    if (form.unknownTime) return 0;
    return calcTrueSolarBranch(
      parseInt(form.clockHour) || 0,
      parseInt(form.clockMinute) || 0,
      form.longitude,
    );
  }, [form.clockHour, form.clockMinute, form.longitude, form.unknownTime]);

  const offsetMin = Math.round((form.longitude - 120) * 4);
  const shichenInfo = SHICHEN[branch];

  // ─── 校验逻辑 ───────────────────────────────────────────
  const y = parseInt(form.year) || 0;
  const m = parseInt(form.month) || 0;
  const d = parseInt(form.day) || 0;

  const errors = {
    year: !form.year ? t('errors.yearRequired')
      : y < 1900 || y > 2026 ? t('errors.yearRange')
      : '',
    month: !form.month ? t('errors.monthRequired') : '',
    day: !form.day ? t('errors.dayRequired')
      : form.year && form.month && !isValidDate(y, m, d) ? t('errors.noSuchDay', { month: String(m), day: String(d) })
      : '',
  };
  const hasError = Object.values(errors).some(Boolean);

  // ─── 完成度（用于进度条） ────────────────────────────────
  const steps = [
    !!form.year && !!form.month && !!form.day && !errors.year && !errors.month && !errors.day,
    !!form.province && !!form.city,
    form.unknownTime || (!!form.clockHour && !!form.clockMinute),
    true, // 性别有默认值
  ];
  const completedSteps = steps.filter(Boolean).length;

  // ─── Summary chip：全部必填完成后显示 ───────────────────
  const showSummary = steps[0] && steps[2] && !hasError;
  const summaryText = showSummary
    ? [
        t('summary.date', { year: String(y), month: String(m), day: String(d) }),
        placeLabel(form.city || (form.province ? form.province : ''), locale),
        form.unknownTime ? t('summary.unknownHour') : t('summary.hour', { branch: termLabel(SHICHEN_NAMES[branch], locale) }),
        form.gender === 'male' ? t('gender.male') : t('gender.female'),
      ].filter(Boolean).join(' · ')
    : '';

  const handleProvince = (prov: string) => {
    const provData = PROVINCES.find(p => p.name === prov);
    const firstCity = provData?.cities[0];
    setForm({ ...form, province: prov, city: firstCity?.name || '', longitude: firstCity?.longitude ?? 120 });
  };

  const handleCity = (cityName: string) => {
    const prov = PROVINCES.find(p => p.name === form.province);
    const cityData = prov?.cities.find(c => c.name === cityName);
    setForm({ ...form, city: cityName, longitude: cityData?.longitude ?? 120 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({ year: true, month: true, day: true });
    if (hasError) return;
    onFormSave?.({ ...form });
    onSubmit({ year: y, month: m, day: d, hour: branch, gender: form.gender, name: form.name || undefined, province: form.province || undefined, city: form.city || undefined, longitude: form.province ? form.longitude : undefined });
  };

  // ─── 样式变量 ────────────────────────────────────────────
  // 设计系统（#57）：全部来自 app/globals.css 的 token。日 / 夜靠 CSS 切换，
  // 服务端和浏览器渲染出同一串样式，也就不再有水合不一致（以前日间表单会卡在深色）。
  const bg = 'var(--bg-card)';
  const border = 'var(--bdr-med)';
  const labelClr = 'var(--tx-2)';
  const inputBg = 'transparent';
  const inputBorder = 'var(--bdr-med)';
  const inputClr = 'var(--tx-0)';
  const focusBorder = 'var(--tx-0)';
  const errorClr = 'var(--ji)';
  const panelBg = 'transparent';
  const panelBorder = 'var(--bdr)';
  const goldText = 'var(--tx-0)';
  const summaryBg = 'var(--bg-1)';
  const summaryBorder = 'transparent';
  const summaryClr = 'var(--tx-1)';
  const hintClr = 'var(--tx-3)';

  // 与 .input-base 同规格：52px 高、0 圆角、16px（iOS 不缩放）；焦点描边由全局 :focus-visible 提供
  const inputStyle = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: inputClr,
    borderRadius: 'var(--r-sm)',
    minHeight: 'var(--control-h)',
    padding: '0 16px',
    fontSize: '16px',
    width: '100%',
  } as React.CSSProperties;

  const errorInputStyle = { ...inputStyle, borderColor: errorClr };

  function FieldError({ msg }: { msg: string }) {
    return (
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ color: errorClr, fontSize: '12px', marginTop: '4px' }}
          >
            ✕ {msg}
          </motion.p>
        )}
      </AnimatePresence>
    );
  }

  const showErr = (field: string) => touched[field] || submitAttempted;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.15, 1, 0.35, 1] }}
      style={bare ? undefined : { background: bg, border: `1px solid ${border}`, borderRadius: 'var(--r-md)', padding: '24px', backdropFilter: 'blur(var(--glass-blur))' }}
    >
      {/* ── 姓名 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="bf-name" style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>{t('name.label')}</label>
        <input
          type="text"
          placeholder={t('name.placeholder')}
          id="bf-name" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = focusBorder; }}
          onBlur={e => { e.target.style.borderColor = inputBorder; }}
        />
      </div>

      {/* ── 出生日期 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="bf-year" style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>{t('date.label')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <select
              id="bf-year" value={form.year}
              onChange={e => { setForm({ ...form, year: e.target.value }); setTouched(t => ({ ...t, year: true })); }}
              style={showErr('year') && errors.year ? errorInputStyle : inputStyle}
              required
            >
              <option value="">{t('date.year')}</option>
              {Array.from({ length: 127 }, (_, i) => 2026 - i).map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
            <FieldError msg={showErr('year') ? errors.year : ''} />
          </div>
          <div>
            <select
              id="bf-month" aria-label={t('date.monthAria')} value={form.month}
              onChange={e => { setForm({ ...form, month: e.target.value }); setTouched(t => ({ ...t, month: true })); }}
              style={showErr('month') && errors.month ? errorInputStyle : inputStyle}
              required
            >
              <option value="">{t('date.month')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
                <option key={mo} value={String(mo)}>{t('date.monthOption', { month: String(mo) })}</option>
              ))}
            </select>
            <FieldError msg={showErr('month') ? errors.month : ''} />
          </div>
          <div>
            <select
              id="bf-day" aria-label={t('date.dayAria')} value={form.day}
              onChange={e => { setForm({ ...form, day: e.target.value }); setTouched(t => ({ ...t, day: true })); }}
              style={showErr('day') && errors.day ? errorInputStyle : inputStyle}
              required
            >
              <option value="">{t('date.day')}</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dy => (
                <option key={dy} value={String(dy)}>{t('date.dayOption', { day: String(dy) })}</option>
              ))}
            </select>
            <FieldError msg={showErr('day') ? errors.day : ''} />
          </div>
        </div>
      </div>

      {/* ── 出生地点 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="bf-province" style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>{t('place.label')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select
            id="bf-province" value={form.province}
            onChange={e => handleProvince(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = focusBorder; }}
            onBlur={e => { e.target.style.borderColor = inputBorder; }}
          >
            <option value="">{t('place.province')}</option>
            {PROVINCES.map(p => (
              <option key={p.name} value={p.name}>{placeLabel(p.name, locale)}</option>
            ))}
          </select>
          <select
            id="bf-city" aria-label={t('place.cityAria')} value={form.city}
            onChange={e => handleCity(e.target.value)}
            disabled={!form.province}
            style={{ ...inputStyle, opacity: form.province ? 1 : 0.45 }}
            onFocus={e => { e.target.style.borderColor = focusBorder; }}
            onBlur={e => { e.target.style.borderColor = inputBorder; }}
          >
            <option value="">{form.province ? t('place.city') : t('place.pickProvince')}</option>
            {cityList.map(c => (
              <option key={c.name} value={c.name}>{placeLabel(c.name, locale)}</option>
            ))}
          </select>
        </div>
        <AnimatePresence mode="wait">
          {form.province ? (
            <motion.p
              key="location-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '12px', color: hintClr, marginTop: '6px' }}
            >
              {t('place.info', {
                city: form.city ? placeLabel(form.city, locale) : t('place.pickCity'),
                longitude: form.longitude.toFixed(1),
                offset: `${offsetMin > 0 ? '+' : ''}${offsetMin}`,
              })}
            </motion.p>
          ) : (
            <motion.p
              key="location-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '12px', color: hintClr, marginTop: '6px' }}
            >
              {t('place.hint')}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── 出生时间 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="bf-hour" style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>{t('time.label')}</label>
        <div style={{ opacity: form.unknownTime ? 0.45 : 1, pointerEvents: form.unknownTime ? 'none' : 'auto', transition: 'opacity var(--dur-1) linear' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <select
              id="bf-hour" value={form.clockHour}
              onChange={e => setForm({ ...form, clockHour: e.target.value })}
              style={inputStyle}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={String(h)}>{t('time.hourOption', { hour: h.toString().padStart(2, '0') })}</option>
              ))}
            </select>
            <select
              id="bf-minute" aria-label={t('time.minuteAria')} value={form.clockMinute}
              onChange={e => setForm({ ...form, clockMinute: e.target.value })}
              style={inputStyle}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(min => (
                <option key={min} value={String(min)}>{t('time.minuteOption', { minute: min.toString().padStart(2, '0') })}</option>
              ))}
            </select>
          </div>
          {/* 真太阳时结果 */}
          <div style={{ padding: '4px 0' }}>
            <span style={{ fontSize: '14px', color: hintClr }}>{t('time.trueSolar')}</span>
            <span style={{ fontSize: '16px', color: goldText, fontWeight: 600 }}>
              {t('time.branchHour', { branch: termLabel(SHICHEN_NAMES[branch], locale) })}
            </span>
            {shichenInfo && (
              <span style={{ fontSize: '14px', color: hintClr, marginLeft: '4px' }}>
                {t('time.range', { range: shichenInfo.range })}
              </span>
            )}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.unknownTime}
            onChange={e => setForm({ ...form, unknownTime: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', color: hintClr }}>
            {t('time.unknown')}
          </span>
        </label>
      </div>

      {/* ── 性别 ── */}
      <div style={{ marginBottom: '20px' }}>
        <span id="bf-gender" style={{ display: 'block', fontSize: '14px', color: labelClr, marginBottom: '8px' }}>{t('gender.label')}</span>
        <div role="group" aria-labelledby="bf-gender" style={{ display: 'flex', gap: '8px' }}>
          {(['male', 'female'] as const).map(g => {
            const active = form.gender === g;
            const isMale = g === 'male';
            // 单色：选中的一项实线描边 + 正文色，不再用蓝 / 粉区分性别
            return (
              <motion.button
                key={g}
                type="button"
                aria-pressed={active}
                onClick={() => setForm({ ...form, gender: g })}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                {isMale ? t('gender.male') : t('gender.female')}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 确认信息 Summary Chip ── */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div style={{
              background: summaryBg,
              border: `1px solid ${summaryBorder}`,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '14px', color: summaryClr, flex: 1 }}>
                {summaryText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 提交按钮 ── */}
      {!hideSubmit && <motion.button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%' }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span aria-hidden="true" className="pole-mark animate-breathe" style={{ width: 12, height: 12 }} />
            {t('submitting')}
          </span>
        ) : t('submit')}
      </motion.button>}
    </motion.form>
  );
}
