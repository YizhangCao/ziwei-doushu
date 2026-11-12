/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The chart glossary for the English version (#59).
 *
 * The product owner's rule: use the academic English rendering of a term where one
 * exists (basis 'A', with its source); a Western-astrology or plain substitute only
 * where he approved it (basis 'B'); otherwise pinyin (basis 'C'). Renderings built
 * from attested parts, such as 命主 "Life Ruler", count as academic (approved 11/11).
 *
 * Sets that are only partly attested (the stars, brightness grades, sihua, stems and
 * branches) show pinyin as a whole set on the board, so a cell never mixes "Greedy
 * Wolf" with "Tianji"; their academic English is kept as a gloss for readings and
 * the AI prompt. Palaces and concepts are fully attested and show English.
 *
 * The chart data itself stays Chinese: the engine keys on Chinese names and
 * /api/interpret checks them against Chinese allowlists, so labels are translated
 * only when rendered. Known pinyin homographs: 天府/天福 (Tianfu), 天钺/天月 (Tianyue).
 */

import type { Locale } from './locale';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';

export type TermSet = 'palace' | 'majorStar' | 'auxStar' | 'brightness' | 'sihua' | 'stem' | 'branch' | 'ju' | 'concept';
export type Basis = 'A' | 'B' | 'C';

export interface Term {
  zh: string;
  set: TermSet;
  /** Hanyu Pinyin without tone marks. */
  pinyin: string;
  basis: Basis;
  /** Academic rendering (A) or approved substitute (B). Absent for C. */
  en?: string;
  /** Where an A rendering is attested; see SOURCES. */
  source?: string;
}

/** Works the A renderings cite (research for #59, 11/11). */
export const SOURCES = {
  Kot17: 'Jeffrey Kotyk, Buddhist Astrology and Astral Magic in the Tang Dynasty, PhD dissertation, Leiden University, 2017',
  Kot18: 'Jeffrey Kotyk, "The Sinicization of Indo-Iranian Astrology in Medieval China", Sino-Platonic Papers 282, 2018',
  Hom23: 'Stéphanie Homola, The Art of Fate Calculation, Berghahn, 2023',
  Fra90: 'Herbert Franke, "The Taoist Elements in the Buddhist Great Bear Sūtra", Asia Major 3.1, 1990, 75–111',
  Lia25: 'Chenxue Liang, "The Zokushōsai Ritual", Religions 16(12):1555, 2025',
  IEP: 'Ronnie Littlejohn, "Wuxing", Internet Encyclopedia of Philosophy',
  SEP: 'Franklin Perkins, "Metaphysics in Chinese Philosophy", Stanford Encyclopedia of Philosophy',
  Mar16: 'Jean-Claude Martzloff, Astronomy and Calendars, Springer, 2016',
} as const;

/** The only non-academic renderings the product owner approved (11/11). */
export const APPROVED_SUBSTITUTES = ['三方四正', '大限', '流年', '合盘'] as const;

/** Sets the board shows in pinyin, keeping any academic English as a gloss. */
const PINYIN_SETS: ReadonlySet<TermSet> = new Set<TermSet>(['majorStar', 'auxStar', 'brightness', 'sihua', 'stem', 'branch']);

const a = (zh: string, set: TermSet, pinyin: string, en: string, source: string): Term => ({ zh, set, pinyin, basis: 'A', en, source });
const b = (zh: string, set: TermSet, pinyin: string, en: string): Term => ({ zh, set, pinyin, basis: 'B', en });
const c = (zh: string, set: TermSet, pinyin: string): Term => ({ zh, set, pinyin, basis: 'C' });

const PALACES: Term[] = [
  a('命宫', 'palace', 'minggong', 'Life', 'Kot17 p.137 ("life palace")'),
  a('身宫', 'palace', 'shengong', 'Body', 'Kot17 p.137 ("body palace")'),
  a('兄弟', 'palace', 'xiongdi', 'Brothers', 'Kot17 pp.157, 215; Kot18 p.44'),
  a('夫妻', 'palace', 'fuqi', 'Marriage', 'Kot17 p.157'),
  a('子女', 'palace', 'zinü', 'Children', 'Kot17 pp.157, 215; Kot18 p.44 (for the synonym 男女)'),
  a('财帛', 'palace', 'caibo', 'Wealth', 'Kot17 p.215; Kot18 p.44'),
  a('疾厄', 'palace', 'jie', 'Illness', 'Kot17 p.215'),
  a('迁移', 'palace', 'qianyi', 'Travel', 'Kot17 pp.157, 215'),
  a('仆役', 'palace', 'puyi', 'Servants', 'Kot17 p.157 (僮僕 "servants")'),
  a('交友', 'palace', 'jiaoyou', 'Companions', 'Kot18 p.45 (交遊宮)'),
  a('官禄', 'palace', 'guanlu', 'Office', 'Kot18 p.45; Kot17 p.215 ("office–salary")'),
  a('田宅', 'palace', 'tianzhai', 'Estate', 'Kot17 pp.157, 215'),
  a('福德', 'palace', 'fude', 'Fortune', 'Kot17 pp.157, 216; Kot18 p.44'),
  a('父母', 'palace', 'fumu', 'Parents', 'Kot18 p.45 (父宮 "Father", 母宮 "Mother")'),
];

const MAJOR_STARS: Term[] = [
  c('紫微', 'majorStar', 'Ziwei'),
  c('天机', 'majorStar', 'Tianji'),
  a('太阳', 'majorStar', 'Taiyang', 'the Sun', 'Kot18 p.70'),
  a('武曲', 'majorStar', 'Wuqu', 'Military Corner', 'Fra90 p.93'),
  c('天同', 'majorStar', 'Tiantong'),
  a('廉贞', 'majorStar', 'Lianzhen', 'Pure Virtue', 'Fra90 p.93'),
  c('天府', 'majorStar', 'Tianfu'),
  a('太阴', 'majorStar', 'Taiyin', 'the Moon', 'Kot18 p.70'),
  a('贪狼', 'majorStar', 'Tanlang', 'Greedy Wolf', 'Fra90 p.93'),
  a('巨门', 'majorStar', 'Jumen', 'Huge Gate', 'Fra90 p.93'),
  c('天相', 'majorStar', 'Tianxiang'),
  c('天梁', 'majorStar', 'Tianliang'),
  c('七杀', 'majorStar', 'Qisha'),
  a('破军', 'majorStar', 'Pojun', 'Destroyer of the Army', 'Fra90 p.93'),
];

/** The lucky and baleful stars the board shows next to the main stars. */
const AUX_STARS: Term[] = [
  c('左辅', 'auxStar', 'Zuofu'),
  c('右弼', 'auxStar', 'Youbi'),
  c('文昌', 'auxStar', 'Wenchang'),
  a('文曲', 'auxStar', 'Wenqu', 'Civilian Corner', 'Fra90 p.93'),
  c('天魁', 'auxStar', 'Tiankui'),
  c('天钺', 'auxStar', 'Tianyue'),
  a('禄存', 'auxStar', 'Lucun', 'Happiness Retained', 'Fra90 p.93'),
  c('天马', 'auxStar', 'Tianma'),
  c('擎羊', 'auxStar', 'Qingyang'),
  c('陀罗', 'auxStar', 'Tuoluo'),
  c('火星', 'auxStar', 'Huoxing'),
  c('铃星', 'auxStar', 'Lingxing'),
  c('地空', 'auxStar', 'Dikong'),
  c('地劫', 'auxStar', 'Dijie'),
  c('天空', 'auxStar', 'Tiankong'),
  c('红鸾', 'auxStar', 'Hongluan'),
  c('天喜', 'auxStar', 'Tianxi'),
  c('封诰', 'auxStar', 'Fenggao'),
  c('天巫', 'auxStar', 'Tianwu'),
  c('天福', 'auxStar', 'Tianfu'),
  c('孤辰', 'auxStar', 'Guchen'),
  c('寡宿', 'auxStar', 'Guasu'),
  c('龙池', 'auxStar', 'Longchi'),
  c('凤阁', 'auxStar', 'Fengge'),
  c('天哭', 'auxStar', 'Tianku'),
  c('天虚', 'auxStar', 'Tianxu'),
  c('天伤', 'auxStar', 'Tianshang'),
  c('天使', 'auxStar', 'Tianshi'),
  c('解神', 'auxStar', 'Jieshen'),
  c('年解', 'auxStar', 'Nianjie'),
  c('三台', 'auxStar', 'Santai'),
  c('八座', 'auxStar', 'Bazuo'),
  c('台辅', 'auxStar', 'Taifu'),
  c('恩光', 'auxStar', 'Enguang'),
  c('天贵', 'auxStar', 'Tiangui'),
  c('天官', 'auxStar', 'Tianguan'),
  c('天才', 'auxStar', 'Tiancai'),
  c('天寿', 'auxStar', 'Tianshou'),
  c('天德', 'auxStar', 'Tiande'),
  c('月德', 'auxStar', 'Yuede'),
  c('天月', 'auxStar', 'Tianyue'),
  c('天刑', 'auxStar', 'Tianxing'),
  c('阴煞', 'auxStar', 'Yinsha'),
  c('大耗', 'auxStar', 'Dahao'),
  c('蜚廉', 'auxStar', 'Feilian'),
  c('华盖', 'auxStar', 'Huagai'),
  c('旬空', 'auxStar', 'Xunkong'),
  c('副旬', 'auxStar', 'Fuxun'),
  c('截空', 'auxStar', 'Jiekong'),
  c('副截', 'auxStar', 'Fujie'),
];

const BRIGHTNESS: Term[] = [
  a('庙', 'brightness', 'Miao', 'Shrine', 'Kot18 p.73'),
  a('旺', 'brightness', 'Wang', 'Flourishing', 'Kot18 pp.32, 73'),
  c('得', 'brightness', 'De'),
  c('利', 'brightness', 'Li'),
  c('平', 'brightness', 'Ping'),
  c('不', 'brightness', 'Bu'),
  c('陷', 'brightness', 'Xian'),
];

const SIHUA: Term[] = [
  a('禄', 'sihua', 'Lu', 'Luck', 'Hom23 tab. A3.5 p.260 (化祿 "Transformation of Luck")'),
  c('权', 'sihua', 'Quan'),
  c('科', 'sihua', 'Ke'),
  a('忌', 'sihua', 'Ji', 'Taboo', 'Hom23 tab. A3.5 p.260 (化忌 "Transformation of Taboo")'),
  a('化禄', 'sihua', 'Hualu', 'Transformation of Luck', 'Hom23 tab. A3.5 p.260'),
  c('化权', 'sihua', 'Huaquan'),
  c('化科', 'sihua', 'Huake'),
  a('化忌', 'sihua', 'Huaji', 'Transformation of Taboo', 'Hom23 tab. A3.5 p.260'),
];

const STEM_PINYIN = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
const BRANCH_PINYIN = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
const STEM_TERMS: Term[] = STEMS.map((zh, i) => c(zh, 'stem', STEM_PINYIN[i]));
const BRANCH_TERMS: Term[] = BRANCHES.map((zh, i) => c(zh, 'branch', BRANCH_PINYIN[i]));

const JU: Term[] = [
  a('水二局', 'ju', 'shuierju', 'Water-2 Configuration', 'Hom23 tabs. 3.16–3.17 pp.155–156 ("configuration type")'),
  a('木三局', 'ju', 'musanju', 'Wood-3 Configuration', 'Hom23 tabs. 3.16–3.17 pp.155–156 ("configuration type")'),
  a('金四局', 'ju', 'jinsiju', 'Metal-4 Configuration', 'Hom23 tabs. 3.16–3.17 pp.155–156 ("configuration type")'),
  a('土五局', 'ju', 'tuwuju', 'Earth-5 Configuration', 'Hom23 tabs. 3.16–3.17 pp.155–156 ("configuration type")'),
  a('火六局', 'ju', 'huoliuju', 'Fire-6 Configuration', 'Hom23 tabs. 3.16–3.17 pp.155–156 ("configuration type")'),
];

const CONCEPTS: Term[] = [
  a('紫微斗数', 'concept', 'Ziwei Doushu', 'Ziwei Doushu (Purple Star Astrology)', 'Hom23 intro p.3'),
  a('命盘', 'concept', 'mingpan', 'Natal Chart', 'Kot18 pp.35, 81'),
  a('宫', 'concept', 'gong', 'Palace', 'Kot17 p.137; Kot18 p.29 n.49'),
  a('本命', 'concept', 'benming', 'Natal', 'Kot17 pp.198, 230; Lia25 p.5'),
  a('命主', 'concept', 'mingzhu', 'Life Ruler', 'Kot17 pp.137, 234 (命 "life", 主 "ruler")'),
  a('身主', 'concept', 'shenzhu', 'Body Ruler', 'Kot17 pp.137, 234 (身 "body", 主 "ruler")'),
  a('四化', 'concept', 'sihua', 'Four Transformations', 'Hom23 tab. A3.5 p.260 (化 "transformation")'),
  a('主星', 'concept', 'zhuxing', 'Main Stars', 'Hom23 tab. 3.18 p.157'),
  a('辅星', 'concept', 'fuxing', 'Secondary Stars', 'Hom23 tab. 3.19 p.158'),
  a('吉星', 'concept', 'jixing', 'Auspicious Stars', 'Kot17 p.45 (不吉星 "inauspicious star")'),
  a('煞星', 'concept', 'shaxing', 'Baleful Stars', 'Hom23 intro p.9 ("baleful stars")'),
  a('小限', 'concept', 'xiaoxian', 'Lesser Limit', 'Kot18 p.35'),
  a('五行', 'concept', 'wuxing', 'Five Phases', 'IEP §1; SEP §3.4; Hom23 p.5'),
  a('五行局', 'concept', 'wuxingju', 'Five Phases Configuration', 'Hom23 tabs. 3.16–3.17 pp.155–156'),
  a('天干', 'concept', 'tiangan', 'Heavenly Stems', 'Hom23 tab. 3.2 p.131'),
  a('地支', 'concept', 'dizhi', 'Earthly Branches', 'Hom23 tab. 3.3 p.131; Kot18 p.25'),
  a('阴阳', 'concept', 'yinyang', 'yin and yang', 'SEP; Kot18 p.53'),
  a('农历', 'concept', 'nongli', 'Chinese lunisolar calendar', 'Mar16'),
  a('时辰', 'concept', 'shichen', 'double hour', 'Kot18 pp.25, 27'),
  b('三方四正', 'concept', 'sanfang sizheng', 'trine and opposition'),
  b('大限', 'concept', 'daxian', 'Decade'),
  b('流年', 'concept', 'liunian', 'Year'),
  b('合盘', 'concept', 'hepan', 'Compatibility'),
  c('格局', 'concept', 'geju'),
  c('流月', 'concept', 'liuyue'),
];

export const GLOSSARY: readonly Term[] = [
  ...PALACES, ...MAJOR_STARS, ...AUX_STARS, ...BRIGHTNESS, ...SIHUA, ...STEM_TERMS, ...BRANCH_TERMS, ...JU, ...CONCEPTS,
];

// Every Chinese name appears once across the sets, so a map by name is unambiguous.
const BY_ZH = new Map<string, Term>(GLOSSARY.map((term) => [term.zh, term]));

export function termFor(zh: string): Term | undefined {
  return BY_ZH.get(zh);
}

/** The English label the board shows: pinyin for partly attested sets, English otherwise. */
export function boardLabel(zh: string): string {
  const term = BY_ZH.get(zh);
  if (!term) return zh;
  return PINYIN_SETS.has(term.set) ? term.pinyin : term.en ?? term.pinyin;
}

/** The label with its academic gloss, for readings and tooltips: "Tanlang (Greedy Wolf)". */
export function withGloss(zh: string): string {
  const term = BY_ZH.get(zh);
  if (!term) return zh;
  if (PINYIN_SETS.has(term.set) && term.en) return `${term.pinyin} (${term.en})`;
  return boardLabel(zh);
}

/** A chart term in the visitor's language; Chinese is returned unchanged. */
export function termLabel(zh: string, locale: Locale): string {
  return locale === 'en' ? boardLabel(zh) : zh;
}

/** A stem-branch pair as the board shows it: 甲子 in Chinese, Jiazi in English. */
export function ganzhiLabel(stem: number, branch: number, locale: Locale): string {
  if (locale !== 'en') return `${STEMS[stem]}${BRANCHES[branch]}`;
  return `${STEM_PINYIN[stem]}${BRANCH_PINYIN[branch].toLowerCase()}`;
}

/** The fixed glossary block for the English system prompt: one "Chinese = English" line per term. */
export function glossaryForPrompt(): string {
  return GLOSSARY.filter((term) => term.set !== 'stem' && term.set !== 'branch')
    .map((term) => {
      if (term.set === 'palace') return `${term.zh} = ${term.en} Palace`;
      if (term.zh === '三方四正') return `${term.zh} = ${term.pinyin} (the ${term.en} palaces)`;
      return `${term.zh} = ${withGloss(term.zh)}`;
    })
    .join('\n');
}
