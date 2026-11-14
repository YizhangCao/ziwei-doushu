import { createTranslator } from 'next-intl';
import { formatList } from '@/lib/i18n/format';
import { termLabel, withGloss } from '@/lib/i18n/glossary';
import type { Locale } from '@/lib/i18n/locale';
import { STAR_BRIEF_EN, STAR_KEYWORDS_EN } from '@/lib/i18n/knowledge-en';
import { STAR_BRIEF_SEO } from '@/lib/seo/knowledge';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';
import type { Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import zhReading from '@/messages/zh/reading.json';
import enReading from '@/messages/en/reading.json';
import zhInsight from '@/messages/zh/insight.json';
import enInsight from '@/messages/en/insight.json';

/**
 * @fileoverview The free rule-based reading (#118): built in the browser from our own star
 * and palace data, with no API call, so every chart gets a reading even when the AI can't
 * answer. Pure: the same chart and locale always give the same reading.
 *
 * It reads only the palaces (names, major stars, brightness, 四化, borrowed stars) and the
 * chart summary (五行局, 命主, 身主), never birthInfo or lunarInfo.
 *
 * Sources: palace domains are the reading panel's palace roles (messages/*\/insight.json);
 * the life-palace briefs are the knowledge index's (STAR_BRIEF_SEO, STAR_BRIEF_EN); star
 * keywords are STAR_DESCRIPTIONS in Chinese and STAR_KEYWORDS_EN in English.
 */

export interface RuleStar {
  /** The engine's Chinese name, the key for everything else. */
  name: string;
  /** The name as shown: Chinese, or pinyin with the academic English gloss. */
  label: string;
}

export interface RulePalaceReading {
  branch: number;
  title: string;
  domain: string;
  /** This palace's own major stars; empty for an empty palace. */
  stars: RuleStar[];
  text: string;
}

export interface RuleBasedReading {
  overview: string;
  palaces: RulePalaceReading[];
}

const MESSAGES = {
  zh: { reading: zhReading, insight: zhInsight },
  en: { reading: enReading, insight: enInsight },
} as const;

// Engine palace name without 宫 → role key in insight.json. iztro calls 交友 仆役.
const ROLE_KEYS: Record<string, keyof typeof zhInsight.roles> = {
  命: 'life', 兄弟: 'brothers', 夫妻: 'marriage', 子女: 'children', 财帛: 'wealth', 疾厄: 'illness',
  迁移: 'travel', 交友: 'companions', 仆役: 'companions', 官禄: 'office', 田宅: 'estate', 福德: 'fortune', 父母: 'parents',
};

const bare = (palaceName: string) => palaceName.replace(/宫$/, '');
const majorsOf = (palace: Palace) => palace.stars.filter((s) => s.type === 'major');

export function buildRuleBasedReading(chart: ZiweiChart, locale: Locale): RuleBasedReading {
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: 'reading' });
  const roles = MESSAGES[locale].insight.roles;
  const term = (zh: string) => termLabel(zh, locale);
  const starName = (zh: string) => (locale === 'en' ? withGloss(zh) : zh);
  const list = (items: string[]) => formatList(items, locale);
  // Each star's phrase lists its keywords with commas, so the stars themselves are separated
  // with a semicolon; otherwise the next star reads like one more keyword (#118).
  const starList = (phrases: string[]) => phrases.join(locale === 'en' ? '; ' : '；');

  const palaceTitle = (name: string) => {
    if (locale === 'en') return `${term(bare(name) === '命' ? '命宫' : bare(name))} Palace`;
    return name.endsWith('宫') ? name : `${name}宫`;
  };

  const starPhrase = (star: Star) => {
    const details = [star.brightnessRaw && term(star.brightnessRaw), star.siHua && term(`化${star.siHua}`)].filter(
      (d): d is string => Boolean(d),
    );
    const keywords = locale === 'en'
      ? (STAR_KEYWORDS_EN[star.name] ?? []).join(', ')
      : (STAR_DESCRIPTIONS[star.name]?.keywords.split('·') ?? []).join('、');
    return details.length
      ? t('star.withDetails', { star: starName(star.name), details: details.join(locale === 'en' ? ', ' : '，'), keywords })
      : t('star.plain', { star: starName(star.name), keywords });
  };

  const byBranch = new Map(chart.palaces.map((p) => [p.branch, p]));
  const borrowedStars = (palace: Palace): Star[] => {
    const opposite = byBranch.get(palace.oppositeBranch ?? (palace.branch + 6) % 12);
    return opposite ? majorsOf(opposite) : [];
  };

  const palaces = chart.palaces.map((palace): RulePalaceReading => {
    const title = palaceTitle(palace.name);
    const roleKey = ROLE_KEYS[bare(palace.name)];
    const domain = roleKey ? roles[roleKey] : '';
    const majors = majorsOf(palace);
    const opposite = byBranch.get(palace.oppositeBranch ?? (palace.branch + 6) % 12);

    let text: string;
    if (majors.length) {
      text = t('palace.withStars', { palace: title, domain, stars: starList(majors.map(starPhrase)) });
    } else if (borrowedStars(palace).length && opposite) {
      text = t('palace.borrowed', {
        palace: title, domain, opposite: palaceTitle(opposite.name), stars: starList(borrowedStars(palace).map(starPhrase)),
      });
    } else {
      text = t('palace.none', { palace: title, domain });
    }

    const sihua = palace.stars.filter((s) => s.siHua).map((s) => `${starName(s.name)} ${term(`化${s.siHua}`)}`);
    if (sihua.length) text += ` ${t('palace.sihua', { list: list(sihua) })}`;

    return { branch: palace.branch, title, domain, stars: majors.map((s) => ({ name: s.name, label: starName(s.name) })), text };
  });

  const ming = chart.palaces.find((p) => p.isMingGong) ?? byBranch.get(chart.mingGongBranch);
  const mingMajors = ming ? majorsOf(ming) : [];
  const lead = mingMajors.length ? mingMajors : ming ? borrowedStars(ming) : [];
  const briefs = lead.map((s) => (locale === 'en' ? STAR_BRIEF_EN[s.name] : STAR_BRIEF_SEO[s.name])).filter(Boolean);
  const opening = mingMajors.length
    ? t('overview.withStars', { stars: list(mingMajors.map((s) => starName(s.name))) })
    : lead.length
      ? t('overview.borrowed', { stars: list(lead.map((s) => starName(s.name))) })
      : t('overview.none');
  const basics = chart.mingZhu && chart.shenZhu
    ? t('overview.basics', { ju: term(chart.wuxingJuName), mingZhu: starName(chart.mingZhu), shenZhu: starName(chart.shenZhu) })
    : '';
  const overview = [opening, ...briefs, basics].filter(Boolean).join(locale === 'en' ? ' ' : '');

  return { overview, palaces };
}
