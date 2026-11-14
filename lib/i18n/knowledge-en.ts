/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 11, 2026 · San Francisco, California, USA
 * Last Edited: November 13, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview English star briefs for the knowledge index (#59), one per main star,
 * matching STAR_BRIEF_SEO in lib/seo/knowledge.ts. Direct, high-school-level English;
 * star names in pinyin (lib/i18n/glossary.ts), technical terms such as huaqi (the
 * quality a star turns into) and taohua (romance) in pinyin.
 */

export const STAR_BRIEF_EN: Record<string, string> = {
  '紫微': 'Ziwei is the ruling star of the chart. It stands for dignity and rank, and its huaqi is honor. In the Life Palace it gives a leader’s presence, suited to big platforms and high positions.',
  '天机': 'Tianji is the star of wisdom. It is quick and changeable, and its huaqi is kindness. In the Life Palace it gives a sharp, adaptable mind, suited to advising and planning.',
  '太阳': 'Taiyang (the Sun) is the star of a man’s standing. It governs reputation and public service, and its huaqi is nobility. In the Life Palace it makes a person open and upright, suited to public office and a good name.',
  '武曲': 'Wuqu (Military Corner) is the star of wealth. It is firm and decisive, and its huaqi is money. In the Life Palace it gives a strong head for money, suited to industry and finance.',
  '天同': 'Tiantong is the star of blessings. It is gentle and loves comfort, and its huaqi is good fortune. In the Life Palace it gives a mild temper and a lucky life.',
  '廉贞': 'Lianzhen (Pure Virtue) is a second star of taohua (romance), skilled in both letters and arms, and its huaqi is confinement. In the Life Palace it gives many talents and deep feelings.',
  '天府': 'Tianfu is the southern ruling star that guards wealth. It is steady and careful, and its huaqi is command. In the Life Palace it gives upright conduct and a gift for keeping savings safe.',
  '太阴': 'Taiyin (the Moon) is the star of riches and rank. It governs property and wealth, and its huaqi is prosperity. In the Life Palace it gives delicate feelings, and it is most favorable in a woman’s chart.',
  '贪狼': 'Tanlang (Greedy Wolf) is the star of taohua (romance) and desire. It is talented and sociable, and its huaqi is taohua. In the Life Palace it gives many talents and a wide social circle.',
  '巨门': 'Jumen (Huge Gate) is the star of disputes and eloquence. It governs debate and the media, and its huaqi is darkness. In the Life Palace it gives a way with words, suited to law and teaching.',
  '天相': 'Tianxiang is the star of the seal, a helper. It is loyal and honest, and its huaqi is the seal. In the Life Palace it gives upright conduct, suited to administration and legal work.',
  '天梁': 'Tianliang is the star of the elder, a protector that turns danger into luck, and its huaqi is shelter. In the Life Palace it gives a kind and caring heart, suited to law and medicine.',
  '七杀': 'Qisha is the general’s star. It is solitary, decisive and daring, and its huaqi is severity. In the Life Palace it gives toughness and resolve, suited to the military, the police or starting a business.',
  '破军': 'Pojun (Destroyer of the Army) is the star of breaking and renewal. Ties with close family run thin, and its huaqi is depletion. In the Life Palace it brings pioneering change, suited to technical skills.',
};

/**
 * English keywords for each main star (#118), one for each of STAR_DESCRIPTIONS' keywords in
 * lib/ziwei/constants.ts, in the same order. They are descriptions, not terms, so they are
 * plain English; taohua stays in pinyin with its gloss, as in the briefs above.
 */
export const STAR_KEYWORDS_EN: Record<string, readonly string[]> = {
  '紫微': ['rulership', 'dignity', 'independence'],
  '天机': ['wisdom', 'quick thinking', 'strategy'],
  '太阳': ['boldness', 'official rank', 'generosity'],
  '武曲': ['wealth', 'toughness', 'decisiveness'],
  '天同': ['gentleness', 'enjoying life', 'going with the flow'],
  '廉贞': ['talent', 'trouble with the law', 'taohua (romance)'],
  '天府': ['a store of wealth', 'steadiness', 'caution'],
  '太阴': ['grace', 'wealth', 'softness'],
  '贪狼': ['desire', 'taohua (romance)', 'many talents'],
  '巨门': ['gossip', 'disputes', 'a gift for argument'],
  '天相': ['support', 'administration', 'the seal of office'],
  '天梁': ['protection', 'medicine', 'elders'],
  '七杀': ['generalship', 'resolve', 'solitude'],
  '破军': ['pioneering', 'change', 'destruction'],
};
