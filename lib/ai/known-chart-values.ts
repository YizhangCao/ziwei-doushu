import * as iztroStarLocale from 'iztro/lib/i18n/locales/zh-CN/star';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import type { ZiweiChart } from '@/lib/ziwei/types';

// Allowlists for every chart string that ends up in the AI prompt. The chart arrives from the
// client, so anything outside these sets is treated as untrusted text (CodeQL
// js/system-prompt-injection on PR #27) and the request is rejected with 400.

// The engine takes star names from iztro's zh-CN locale, plus two it places itself (algorithm.ts).
// iztro ships CommonJS with `exports.default`; depending on the loader (Next/tsx vs. Node's ESM
// interop under Vitest) the table arrives either directly or wrapped one level deeper.
type StarTable = typeof iztroStarLocale.default;
const wrapped = iztroStarLocale.default as StarTable | { default: StarTable };
const starTable: StarTable = 'default' in wrapped ? wrapped.default : wrapped;
const STAR_NAMES: ReadonlySet<string> = new Set([...Object.values(starTable), '副旬', '副截']);

// Palace names as generateChart() emits them (iztro's zh-CN palace names, without 身宫/来因).
const PALACE_NAMES: ReadonlySet<string> = new Set([
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母',
]);

const SIHUA: ReadonlySet<string> = new Set(['禄', '权', '科', '忌']);
const STAR_TYPES: ReadonlySet<string> = new Set(['major', 'minor', 'lucky', 'sha']);
const BRIGHTNESS: ReadonlySet<string> = new Set(['bright', 'normal', 'dim']);
const BRIGHTNESS_RAW: ReadonlySet<string> = new Set(['庙', '旺', '得', '利', '平', '不', '闲', '陷', '地']);
const WUXING_JU_NAMES: ReadonlySet<string> = new Set(['水二局', '木三局', '金四局', '土五局', '火六局']);
const STEM_NAMES: ReadonlySet<string> = new Set(STEMS);

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const inSet = (set: ReadonlySet<string>, v: unknown): boolean => typeof v === 'string' && set.has(v);
// Optional fields: the engine leaves some unset and some as '' (e.g. minor stars without a
// brightness). Neither carries text into the prompt, so both count as absent.
const optIn = (set: ReadonlySet<string>, v: unknown): boolean => v === undefined || v === '' || inSet(set, v);
const isNum = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v);
const optBool = (v: unknown): boolean => v === undefined || typeof v === 'boolean';
const isAgeRange = (v: unknown): boolean => Array.isArray(v) && v.length === 2 && v.every(isNum);

function isKnownStar(s: unknown): boolean {
  return isObj(s) && inSet(STAR_NAMES, s.name) && inSet(STAR_TYPES, s.type)
    && optIn(SIHUA, s.siHua) && optIn(BRIGHTNESS, s.brightness) && optIn(BRIGHTNESS_RAW, s.brightnessRaw);
}

function isKnownPalace(p: unknown): boolean {
  if (!isObj(p) || !inSet(PALACE_NAMES, p.name) || !Number.isInteger(p.branch)) return false;
  if ((p.branch as number) < 0 || (p.branch as number) >= BRANCHES.length) return false;
  if (!Array.isArray(p.stars) || !p.stars.every(isKnownStar)) return false;
  if (p.selfSihua !== undefined && !(Array.isArray(p.selfSihua)
    && p.selfSihua.every((m) => isObj(m) && inSet(SIHUA, m.siHua) && inSet(STAR_NAMES, m.starName)))) return false;
  return (p.daXianAge === undefined || isAgeRange(p.daXianAge)) && optBool(p.isMingGong) && optBool(p.isShenGong);
}

function isKnownDaXian(d: unknown): boolean {
  if (!isObj(d) || !isNum(d.startAge) || !isNum(d.endAge) || !inSet(PALACE_NAMES, d.palaceName)) return false;
  if (d.siHua === undefined) return true;
  const h = d.siHua;
  return isObj(h) && isNum(h.stemIndex) && inSet(STEM_NAMES, h.stemName)
    && [h.lu, h.quan, h.ke, h.ji].every((star) => inSet(STAR_NAMES, star));
}

/** True only if every field the prompt serializer reads holds a value the engine can produce. */
export function isKnownChart(chart: unknown): chart is ZiweiChart {
  if (!isObj(chart) || !Array.isArray(chart.palaces) || chart.palaces.length !== 12) return false;
  if (!chart.palaces.every(isKnownPalace)) return false;
  if (!Array.isArray(chart.daXians) || !chart.daXians.every(isKnownDaXian)) return false;
  return inSet(WUXING_JU_NAMES, chart.wuxingJuName) && isNum(chart.currentAge)
    && optIn(STAR_NAMES, chart.mingZhu) && optIn(STAR_NAMES, chart.shenZhu);
}
