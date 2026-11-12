/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview English for the classics library (#59): book metadata, chapter titles and
 * one English rendering per passage. The page shows a passage as the original Chinese
 * followed by `which means: "<PARAGRAPH_EN[id]>"`, so a rendering holds only the text that
 * goes inside those quotes: no surrounding quotes, no Chinese, and ‘single’ quotes for any
 * quotation inside it.
 *
 * The product owner's rules (11/11):
 * - Inside a rendering, technical terms (names of stars, palaces, transformations,
 *   brightness grades, configurations, time cycles and named techniques) are pinyin without
 *   tone marks; everything else is plain English a high-school student can follow, faithful
 *   to the original with nothing added. Concepts are lowercase and joined (minggong,
 *   sanfang sizheng, hualu, daxian, liunian, geju, miao, wang, xian), palaces end in -gong
 *   (caibogong, jiegong, zinügong), star names are capitalized (Ziwei, Qingyang, and the
 *   star groups Beidou, Nandou, Zhongtian), and stems and branches are lowercase (zi, chou).
 *   Configuration names are pinyin in sentence case (Zifu tonggong, Shapolang, Shuanglu
 *   chaoyuan). Star categories and ordinary words use the English of lib/i18n/glossary.ts
 *   (main stars, auspicious stars, baleful stars, the earth phase).
 * - A passage built from parallel pairs (matching length and structure, as in the Gusui fu)
 *   is verse: each pair becomes one rhyming heroic couplet in iambic pentameter (AABB),
 *   lines separated by "\n", and its id is in COUPLET_IDS. A clause left over after the
 *   pairs gets a couplet of its own, so a verse passage always has an even number of lines.
 *   Lists of three or more parallel clauses, and prose with an incidental pair, stay prose.
 * - Titles and metadata are UI text, not quotes, so they use the academic English where one
 *   exists (the Life Palace, the Four Transformations, the Southern Dipper) and give stars in
 *   pinyin with their academic gloss (Tanlang (Greedy Wolf)). Geju has no academic English
 *   in the glossary, so it stays pinyin in titles too.
 * - Apostrophes are typographic (’). No Western names for the stars and no Western-astrology
 *   vocabulary.
 */

export interface BookEn {
  title: string;
  author: string;
  dynasty: string;
  intro: string;
}

export interface ChapterEn {
  title: string;
  subtitle?: string;
}

/** Key for CHAPTER_EN: the book slug and the chapter's index in book.chapters. */
export function chapterKey(slug: string, index: number): string {
  return `${slug}/${index}`;
}

/** One verse passage: its couplet lines, one string per line. */
const verse = (...lines: string[]): string => lines.join('\n');

/** Keyed by book.slug. */
export const BOOK_EN: Record<string, BookEn> = {
  gusuifu: {
    title: 'Gusui fu (Rhapsody on the Marrow)',
    author: 'Ziwei Doushu tradition (no known author)',
    dynasty: 'Ming dynasty',
    intro:
      'The most condensed core verses of Ziwei Doushu, about 1,500 characters in all. Ni Haixia quotes this rhapsody many times in his course Tian Ji, and every student of Ziwei Doushu should read it.',
  },
  quanji: {
    title: 'Ziwei doushu quanji (Collected Works of Ziwei Doushu)',
    author: 'Traditionally attributed to the founding master Chen Tuan',
    dynasty: 'Ming dynasty',
    intro:
      'One of the most authoritative classics of Ziwei Doushu, traditionally said to have been taught by the founding master Chen Tuan of the Song dynasty. It is the core source cited in Ni Haixia’s Tian Ji system.',
  },
  quanshu: {
    title: 'Ziwei doushu quanshu (Complete Book of Ziwei Doushu)',
    author: 'Luo Hongxian (editor)',
    dynasty: 'Ming dynasty',
    intro:
      'The most systematic classic of Ziwei Doushu, stressing how the twelve palaces relate to the Four Transformations. Since the Qing dynasty it has been the main textbook for students of Ziwei Doushu.',
  },
};

/** Keyed by chapterKey(book.slug, chapterIndex). */
export const CHAPTER_EN: Record<string, ChapterEn> = {
  'gusuifu/0': { title: 'General Discussion', subtitle: 'The basic premises of Ziwei Doushu' },
  'gusuifu/1': { title: 'On Ziwei', subtitle: 'The honor of the throne, noble when it has helpers' },
  'gusuifu/2': { title: 'On Qisha', subtitle: 'The lonely general’s star, suited to military posts' },
  'gusuifu/3': { title: 'The Shapolang Geju', subtitle: 'Pioneering and venturing out: a fate of change' },
  'gusuifu/4': { title: 'Jiyue Tongliang', subtitle: 'Steady building, suited to public posts' },
  'gusuifu/5': {
    title: 'On the Four Transformations',
    subtitle: 'Fortune and misfortune in Hualu, Huaquan, Huake and Huaji',
  },
  'gusuifu/6': { title: 'On Zuofu, Youbi, Tiankui and Tianyue', subtitle: 'The nobility of the six auspicious stars' },
  'gusuifu/7': {
    title: 'On the Six Baleful Stars',
    subtitle: 'The misfortune of Qingyang, Tuoluo, Huoxing, Lingxing, Dikong and Dijie',
  },
  'gusuifu/8': {
    title: 'On the Twelve Palaces',
    subtitle: 'What each palace stands for, and its fortune and misfortune',
  },

  'quanji/0': { title: 'Volume One: General Discussion', subtitle: 'The basic rules of Ziwei Doushu' },
  'quanji/1': { title: 'Volume Two: On Ziwei', subtitle: 'The honor of the throne' },
  'quanji/2': {
    title: 'Volume Three: On the Six Stars of the Southern Dipper',
    subtitle: 'Tianfu, Taiyin (the Moon), Tanlang (Greedy Wolf), Jumen (Huge Gate), Tianxiang and Tianliang',
  },
  'quanji/3': {
    title: 'Volume Four: On the Six Stars of the Northern Dipper',
    subtitle:
      'Ziwei, Tianji, Taiyang (the Sun), Wuqu (Military Corner), Lianzhen (Pure Virtue) and Pojun (Destroyer of the Army)',
  },
  'quanji/4': {
    title: 'Volume Five: On the Four Transformations and Geju',
    subtitle: 'The force of the Four Transformations, and the key geju',
  },

  'quanshu/0': { title: 'On the Twelve Palaces: the Life Palace', subtitle: 'The root of reading a fate' },
  'quanshu/1': { title: 'On the Twelve Palaces: the Wealth Palace', subtitle: 'Where wealth comes from' },
  'quanshu/2': { title: 'On the Twelve Palaces: the Office Palace', subtitle: 'The root of a career' },
  'quanshu/3': { title: 'On the Twelve Palaces: the Marriage Palace', subtitle: 'The spouse’s presence' },
  'quanshu/4': { title: 'On the Four Transformations', subtitle: 'Hualu, Huaquan, Huake and Huaji' },
  'quanshu/5': { title: 'The Jiyue Tongliang Geju', subtitle: 'A fate of steady building' },
  'quanshu/6': { title: 'The Shuanglu Chaoyuan Geju', subtitle: 'As rich as Tao Zhu' },
};

/** Keyed by paragraph.id: the text inside `which means: "..."`. */
export const PARAGRAPH_EN: Record<string, string> = {
  // Gusui fu
  'gsf-1-1':
    'The Taiji star is the lord of all the stars. Ziwei, the throne, is the most honored of the stars. Tianfu is a commanding star; in Nandou and Beidou, hualu and huaquan are commanding stars as well. Zuofu and Youbi are the stars that govern the rites of sacrifice.',
  'gsf-1-2': verse(
    'Ziwei is lord, whom Zuofu, Youbi guide;',
    'And Tianfu serves, with Lucun’s gold supplied.',
    'Meet Tianji’s goodness, Tianliang’s shade, be blest;',
    'Meet Lianzhen’s chains and Pojun’s waste, distressed.',
  ),
  'gsf-1-3':
    'The key to reading a fate is to look at the minggong first. The main star of the minggong sets the geju, and the sanfang sizheng set where its strength can be used. Next, look at the shengong, which sets one’s later years and what one finally turns to. Then look at the daxian and liunian, which set the times to advance and to retreat across a whole life.',
  'gsf-2-1':
    'Ziwei is the star of the throne. With Zuofu and Youbi it is noble; with Wenchang and Wenqu it is refined; with Tiankui and Tianyue it has benefactors to support it. If Ziwei sits alone with no helpers, even high rank will not last; only when auspicious stars shine on it from the sanfang sizheng is it a true great geju.',
  'gsf-2-2':
    'Ziwei in the zi or wu palace has the nobility of ‘facing south with its back to the north’, and means great wealth and high rank. Ziwei in chou or wei shares the palace with Pojun, and means firmness and decisiveness. Ziwei in yin or shen shares the palace with Tianfu; this is called the Zifu tonggong geju, and means upright character and plenty of food and clothing.',
  'gsf-2-3':
    'Ziwei in the guanlugong, with no baleful star clashing with it, means one will surely hold high office. Ziwei in the tianzhaigong means property inherited from the family, and the means to buy more of one’s own. Ziwei in the fuqigong means a poised and graceful spouse of uncommon bearing, but one should marry late, not early.',
  'gsf-2-4':
    'Ziwei dreads Dikong and Dijie, which mean a post without pay. Ziwei dreads being a lone lord with no helpers, which means a lone peak standing by itself, and great things are hard to achieve. Ziwei with huaquan means deciding alone; Ziwei with huake means fame; Ziwei with huaji means being controlled by others.',
  'gsf-3-1':
    'Qisha is the general’s star, firm and decisive by nature. When Qisha sits in the minggong, it does not like to share the palace with the auspicious stars; going its own way is its proper geju. Qisha meeting Dikong and Dijie means a lonely, drifting life and a career that is hard to build.',
  'gsf-3-2':
    'The Qisha chaodou geju: Qisha sits in zi, wu, yin or shen, with Ziwei and Tianfu shining on it from the opposite palace. It means rank and salary that flourish. It is best suited to the army, the police and other martial posts, and to opening up new frontiers. One’s whole life carries a noble air that is hard to stop, but one must be tempered by hardship before becoming a person of great ability.',
  'gsf-3-3': verse(
    'Qisha with Qingyang, Tuoluo, wounds and bleeds;',
    'With Huoxing, Lingxing, bold and fierce in deeds;',
    'With hualu, martial honor all life long;',
    'With huaji, gloom instead, and work goes wrong.',
  ),
  'gsf-4-1':
    'When the three stars Qisha, Pojun and Tanlang meet across the minggong, qianyigong, caibogong and guanlugong, it is called the Shapolang geju. It means a life of many changes and an unwillingness to be ordinary, and it suits starting a business, the army and police, and sales. In youth one is easily rash and loses out; only after middle age can one settle down and keep what one has built.',
  'gsf-4-2':
    'If the sanfang of Shapolang holds hualu or huaquan, its moves have force and great things can be done. If the baleful stars in the sanfang are too heavy (Qingyang, Tuoluo, Huoxing and Lingxing all shining on it), its moves come to nothing, and it is better to stay still and hold one’s ground.',
  'gsf-5-1':
    'When the four stars Tianji, Taiyin, Tiantong and Tianliang all enter the minggong, qianyigong, caibogong and guanlugong, it is called the Jiyue tongliang geju. It means a cultured, gentle manner and a clever mind that is good at planning. It best suits public service, scholarship, the arts, medicine, service work and other fields that build up steadily; it does not suit big risks or wild speculation.',
  'gsf-5-2':
    'The old saying ‘Jiyue tongliang serves as a clerk’ means that people with this geju should take public posts and office or paperwork jobs, and live a safe and steady life. If Wenchang, Wenqu and huake also meet it, it means fame that spreads far. What it dreads most is too many baleful stars, which instead mean many changes and little peace.',
  'gsf-6-1': verse(
    'Hualu: wealth, ties, and skill turned into gain;',
    'Huaquan: power, resolve, to hold the rein;',
    'Huake: renown, kind patrons, papers, deeds;',
    'Huaji: sickness, harm, deep lessons it breeds.',
  ),
  'gsf-6-2': verse(
    'With hualu in the minggong, wealth to spare;',
    'With huaquan there, the greatest charge to bear;',
    'With huake there, one’s name is widely known;',
    'With huaji, trials first, then worth is shown.',
  ),
  'gsf-6-3': verse(
    'Huaji in caibogong: wealth comes and goes;',
    'In guanlugong, one’s work is dealt hard blows;',
    'In fuqigong, a marriage full of turns;',
    'In zinügong, thin ties, or friction burns.',
  ),
  'gsf-6-4':
    'When Lucun and hualu meet together in the sanfang of the minggong, it is called Shuanglu chaoyuan, and means wealth to rival Tao Zhu. When huake and huaquan meet together, it is called Kequan shuanghui, and means fame and power, both fine.',
  'gsf-7-1':
    'Zuofu and Youbi are the ‘chancellor stars’, which mean helpers and benefactors. Wenchang and Wenqu are the ‘literary stars’, which mean intelligence and fine talent. Tiankui and Tianyue are the ‘benefactor stars’, which mean someone will lend support at the critical moment.',
  'gsf-7-2':
    'When all six auspicious stars meet in the sanfang sizheng of the minggong, it means a life with no end of benefactors and excellent relations with people. Even if the chart’s geju is ordinary, one can still use the strength of the six auspicious stars to achieve uncommon things.',
  'gsf-7-3':
    'Fubi jiaming: Zuofu and Youbi sit in the two palaces on either side of the minggong. It means a life supported by benefactors, with help whenever trouble comes. It is best of all together with Ziwei in the same palace, which is called the Junchen qinghui geju.',
  'gsf-8-1':
    'Qingyang and Tuoluo are the ‘baleful stars’, which mean bloodshed, quarrels and obstacles. Huoxing and Lingxing are the ‘hot-tempered stars’, which mean rashness, impatience, and injuries or accidents. Dikong and Dijie are the ‘void stars’, which mean money drained away, empty fame, and things without substance.',
  'gsf-8-2':
    'Baleful stars are not all misfortune. A baleful star is like a whetstone: it can forge a power to break through deadlocks that ordinary people do not have. In youth it easily makes one rash and self-harming; only after middle age can one turn the baleful force into power.',
  'gsf-8-3':
    'Yangtuo jiaji: Qingyang and Tuoluo flank the palace where the huaji star sits, and it means great misfortune. In that year and in that daxian, one must be especially alert to bloodshed, lawsuits and major upheavals.',
  'gsf-8-4':
    'Kongjie jiaming: Dikong and Dijie sit in the two palaces on either side of the minggong. It means a life better spent on ideas than on material things. One should work in ‘non-material’ fields such as the arts, religion and metaphysics, and should not go into trade or investing.',
  'gsf-9-1': verse(
    'The minggong is the root from whence we start;',
    'The sanfang is the use that plays its part.',
    'Caibogong rules wealth, guanlugong career,',
    'And qianyigong the ties away from here.',
    'When sanfang sizheng shine with good stars’ light,',
    'Then does the geju work with all its might.',
  ),
  'gsf-9-2': verse(
    'The fuqigong shows what the spouse will be;',
    'The zinügong, the bond with progeny;',
    'The jiegong shows the body’s weakest part;',
    'The qianyigong, the luck when you depart.',
    'In each, the main stars and the sihua call',
    'Its good or ill, its rising or its fall.',
  ),
  'gsf-9-3': verse(
    'The tianzhaigong, the vault: will earnings stay?',
    'The fudegong, mind’s joy: will peace hold sway?',
    'The fumugong reveals our elder ties;',
    'Its rule in papers, too, and contracts lies.',
  ),
  'gsf-9-4':
    'An empty palace borrows from its opposite palace: when a palace has no main star, the main stars of its opposite palace are used to judge that palace’s matters. For example, if the minggong is empty, the main stars of the qianyigong are borrowed to set the chart’s geju.',

  // Quanji
  'qj-1-1':
    'Ziwei Doushu was handed down by the founding master Chen Tuan. From the start it made Ziwei the throne, ruling over the hundred stars. Each star governs its own matters, each has its grades of miao, wang, li and xian, and each brings good or ill depending on how the stars meet and shine on one another. To read a fate, one must first place the stars; second, fix the minggong and shengong; third, look at the good and ill of the twelve palaces; and fourth, consult the feihua of the daxian and liunian.',
  'qj-1-2':
    'The method of placing the stars: first use the birth year’s tiangan to place Ziwei. Once the palace where Ziwei sits is fixed, all the other stars are set out among the twelve palaces by their rules. The fourteen main stars each take their place, and the six auspicious and six baleful stars go along to assist them. Once a chart is set, everything in it comes into view.',
  'qj-1-3':
    'The minggong is the root and governs the geju of one’s whole life; the shengong is the helper and governs where one turns after thirty. Only when the minggong and shengong are clear can one know a person’s advances and retreats. Only from how the stars meet and shine from the sanfang sizheng can one know where a person’s strength can be used. Each of the twelve palaces governs its own matters, and only then can one see the whole map of a life.',
  'qj-2-1':
    'Ziwei is the lord of Beidou and governs all the stars. Ziwei belongs to the earth phase and is a star of honor and nobility. In this art it is the throne; its huaqi is honor. It means loyalty, kindness and a majestic bearing, and going its own way. Both men’s and women’s charts welcome Ziwei in the minggong, but Zuofu and Youbi must come to pay court to it before it is a proper geju.',
  'qj-2-2':
    'When Ziwei sits alone, it needs Zuofu and Youbi, Wenchang and Wenqu, or Tiankui and Tianyue flanking it before it can be of use. A Ziwei standing alone with nothing to lean on will not stay noble for long, even if it rises; only with auspicious stars shining on it from the sanfang sizheng is it the great Junchen qinghui geju.',
  'qj-2-3':
    'With Ziwei in the minggong, the brothers have a noble air and stand tall on their own, and one often gets help from an elder brother. With Ziwei in the zinügong, the children have a noble air, but they must be raised and disciplined fairly. With Ziwei in the fuqigong, the spouse is poised and graceful, but one should marry late, not early.',
  'qj-2-4':
    'With Ziwei in the tianzhaigong, there is property inherited from the family and the means to buy more, and real estate can be the main road to wealth. With Ziwei in the fudegong, the mind seeks style and taste, with a strong sense of self-respect. With Ziwei in the guanlugong, it means great wealth and rank, and one is suited to high positions.',
  'qj-3-1':
    'Tianfu belongs to the earth phase. It is the commanding star of Nandou and the master of the storehouse of wealth. Tianfu sitting alone means upright conduct and no worries about food or clothing. Tianfu sharing a palace with Ziwei is called Zifu tonggong, and means honor and nobility. Tianfu likes best to meet Lucun, which is called Shuanglu chaoyuan, and means great wealth.',
  'qj-3-2':
    'Taiyin is the chief star of Zhongtian and belongs to the water phase. When Taiyin is miao or wang, it means property, wealth and rank; when it falls to xian, it means toil and constant rushing about. Taiyin is most auspicious in a woman’s chart, meaning beauty and a kind, virtuous nature. Taiyin in hai or zi means great wealth; Taiyin in wu or wei loses strength.',
  'qj-3-3':
    'Tanlang is the star of romance and desire, and belongs to both the wood and water phases. Tanlang means many talents and a wide social circle. Tanlang meeting Huoxing is called the Huotan geju, and meeting Lingxing is called the Lingtan geju; both mean sudden windfalls. But Tanlang dreads Dikong and Dijie, which mean all show and no substance.',
  'qj-3-4':
    'Jumen belongs to the water phase; its huaqi is darkness, and it means quarrels and gossip. Jumen is the star of eloquence, suited to the law, teaching and the media. Jumen with hualu means ‘making money with the mouth’; with huaji, quarrels and lawsuits never stop. What Jumen dreads most is sharing a palace with Taiyang in the chou and wei palaces, which is called Riyue fanbei.',
  'qj-3-5':
    'Tianxiang belongs to the water phase; its huaqi is the seal, and it is a star of assistance. Tianxiang is loyal, kind and honest, and suited to administration, secretarial work and legal affairs. Tianxiang does not like to sit alone; it does best sharing a palace with Ziwei or Lianzhen, borrowing their air of authority to get things done.',
  'qj-3-6':
    'Tianliang belongs to the earth phase; its huaqi is shelter, and it is the star of the old. Tianliang means kindness, compassion, solitude and strain with kin, and the power to resolve trouble. Tianliang suits law, medicine, education and religion. Tianliang with huake means fame; with hualu it is, on the contrary, hollow and unsteady.',
  'qj-4-1': 'Ziwei belongs to the earth phase; it was discussed in Volume Two.',
  'qj-4-2':
    'Tianji belongs to the wood phase; its huaqi is goodness, and it is the star of wisdom. Tianji means cleverness, quick wits and restlessness. With Tianji in the minggong, one thinks quickly and is suited to consulting, planning, and culture and education. What Tianji dreads most is changing its mind with no firm aim; it needs Wenchang and Wenqu shining on it before it can amount to something.',
  'qj-4-3':
    'Taiyang belongs to the fire phase; its huaqi is nobility, and it is the star of nobility for men. Taiyang means reputation, public affairs and social life. When Taiyang is miao or wang, it means high rank; when it falls to xian, one toils without reward. Taiyang does best in mao, chen, si and wu, and loses strength when it sits in xu, hai, zi or chou.',
  'qj-4-4':
    'Wuqu belongs to the metal phase; its huaqi is wealth, and it is the chief of the wealth stars. Wuqu means firmness and decisiveness, and skill at managing money and running a business. Wuqu with huaji means surgery, bloodshed and accidents with metal. Wuqu sharing a palace with Qisha in chou or wei is called the Wuqu Qisha geju, and means an upright, unbending nature and martial rank.',
  'qj-4-5':
    'Lianzhen belongs to both the fire and wood phases; its huaqi is confinement, and it is a lesser star of romance. Lianzhen has both civil and martial gifts, and many talents. Lianzhen with huaji means bloodshed, lawsuits and tangled love affairs. Lianzhen sharing a palace with Tianxiang is the Lianxiang geju, and means a name for honesty and clean hands.',
  'qj-4-6':
    'Pojun belongs to the water phase; its huaqi is waste, and it is the star of tearing down and making new. Pojun means breaking new ground, change, and weak ties with close family. Pojun suits making one’s way in the world with a technical skill. Pojun with hualu is called ‘break, then build’, and means scattering first and gathering later.',
  'qj-5-1':
    'Hualu means sources of wealth, good connections, and turning skill into money. Hualu in the sanfang of the minggong means wealth flowing in from many sources; hualu in the caibogong means money flowing in and out, with a steady regular income.',
  'qj-5-2':
    'Huaquan means power, decisiveness and taking responsibility. Huaquan in the minggong means one can take charge of a whole area alone; huaquan in the guanlugong means control over one’s career, and one should take the road of management or of technical authority.',
  'qj-5-3':
    'Huake means fame, documents and benefactors. Huake in the minggong means fame that spreads far; huake in the shengong means gaining profit through one’s name, and suits culture and education, research and consulting.',
  'qj-5-4':
    'Huaji means illness, baleful force and deep lessons. Huaji in the sanfang of the minggong means a lifelong ‘blunt spot’: this is the deepest lesson in the chart’s geju, and getting past it is great wisdom. Around the age of thirty, huaji is at its sharpest.',
  'qj-5-5':
    'The Zifu tonggong geju: Ziwei and Tianfu both enter the minggong. It means upright conduct, no worries about food or clothing, and a gift for leadership. It needs Zuofu and Youbi to work with it before it is a complete great geju.',
  'qj-5-6':
    'The Qisha chaodou geju: Qisha sits in the minggong in the zi, wu, yin or shen palace, with Ziwei and Tianfu shining on it from the opposite palace. It means rank and salary that flourish: high honor in a martial career. It best suits the army, the police, government, or top management in business.',
  'qj-5-7':
    'The Shuanglu chaoyuan geju: hualu and Lucun meet together in the sanfang sizheng of the minggong, so wealth surges in and there is plenty of food and clothing. As the old saying goes, ‘Shuanglu chaoyuan, wealth to rival Tao Zhu’: it means never worrying about money all one’s life.',
  'qj-5-8':
    'The Jiyue tongliang geju: the four stars Tianji, Taiyin, Tiantong and Tianliang all enter the minggong, qianyigong, caibogong and guanlugong. It means a cultured, gentle manner and a clever mind that is good at planning. It best suits public service, scholarship, the arts, medicine, service work and other fields that build up steadily.',
  'qj-5-9':
    'The Shapolang geju: the three stars Qisha, Pojun and Tanlang meet in the minggong. It means a life of many changes and an unwillingness to be ordinary, and it suits starting a business, the army and police, business development and sales. Only after middle age can one settle down and keep what one has built.',
  'qj-5-10':
    'The Riyue tonggong geju: Taiyang and Taiyin both enter the chou palace or the wei palace. It means good luck with the opposite sex, a smooth career, and fame that spreads far. In the chou palace its strength is fairly even; in the wei palace it is a little weaker.',

  // Quanshu
  'qs-1-1':
    'The minggong is the root of one’s whole life and the hinge on which all matters turn. Once the minggong is fixed, the geju of one’s whole life is fixed. To read the minggong, look first at its main stars, then at the supporting and baleful stars, and then at the sihua and at the stars that meet and shine on it from the sanfang sizheng.',
  'qs-1-2':
    'When the main star of the minggong is miao or wang, it means an inborn advantage, and one gets twice the result for half the effort. When it falls to xian, it means an inborn disadvantage, yet on the contrary it can mean great success: a person whose star is xian is driven by two words, ‘not content’, and can break out in a comeback that a miao or wang chart cannot achieve.',
  'qs-1-3':
    'When the minggong has the six auspicious stars (Zuofu, Youbi, Wenchang, Wenqu, Tiankui, Tianyue), it means a life with no end of benefactors. When the minggong has the six baleful stars (Qingyang, Tuoluo, Huoxing, Lingxing, Dikong, Dijie), it means many setbacks and hard trials; but if one can endure them, one becomes a person of great ability after all.',
  'qs-2-1':
    'The caibogong governs one’s sources of wealth, income and way of handling money across a lifetime. With different main stars in the caibogong, the ways of making money differ: Ziwei in the caibogong means money from office, Wuqu means money from trade, Taiyin means money from property, and Jumen means money from one’s gift for words.',
  'qs-2-2': verse(
    'Caibogong’s hualu in minggong: wealth flows;',
    'With huaji there, the money comes and goes;',
    'With Lucun there, a steady gain will follow;',
    'With Dikong, Dijie: loss, and fame rings hollow.',
  ),
  'qs-3-1':
    'The guanlugong governs career, status and achievement in society. With different main stars in the guanlugong, careers go in different directions: Ziwei there suits high posts on a big stage; Taiyang suits public service and reputation; Wuqu suits finance and industry; Lianzhen suits work that needs both civil and martial skills.',
  'qs-3-2':
    'When the guanlugong’s huaquan enters the minggong, one can take charge of a whole area alone. Hualu in the guanlugong means money that comes from one’s work; huaji in the guanlugong means ups and downs at work.',
  'qs-4-1':
    'The fuqigong governs the spouse’s temperament and the state of the marriage. Ziwei in the fuqigong means a poised spouse with an air of authority, and one should marry late. Tanlang in the fuqigong means an affectionate spouse with much romance around them. Tianliang in the fuqigong means a mature, steady spouse who is older.',
  'qs-4-2':
    'When the fuqigong’s huaji clashes with the minggong, it means a marriage with many ups and downs. When the fuqigong has the six baleful stars, one must take special care through the trials of love. When the fuqigong has the six auspicious stars, it means the spouse is one’s benefactor.',
  'qs-5-1':
    'The sihua are the essence of the chart: hualu means wealth, huaquan means power, huake means fame, and huaji means illness. The palaces where the sihua sit decide the turning points of the major events in a life.',
  'qs-5-2':
    'The birth-year sihua are the natal sihua and never change. Ni Haixia stresses that the sihua stars do not move; one only looks at where the daxian and liunian have reached. He does not recommend the zihua, gonggan feihua, laiyingong and other methods of the northern Flying Star school.',
  'qs-5-3':
    'Hualu in the sanfang sizheng of the minggong: steady sources of wealth, many good connections, and skills that can be turned into money. Hualu in the fuqigong: a sweet marriage. Hualu in the guanlugong: a career and an income that go hand in hand.',
  'qs-5-4':
    'Huaji in the sanfang sizheng of the minggong: a life with deep lessons, best faced rather than run from. Huaji in the fuqigong: a marriage with many trials. Huaji in the guanlugong: a career with many ups and downs, but after the hardship one becomes a true expert.',
  'qs-6-1':
    'When the four stars Tianji, Taiyin, Tiantong and Tianliang all enter the sanfang sizheng of the minggong, it is called the Jiyue tongliang geju. Cultured and gentle, clever and good at planning, such a person is best suited to public service, scholarship, the arts, medicine, service work and other fields that build up steadily.',
  'qs-6-2':
    'The old saying ‘Jiyue tongliang serves as a clerk’ means that people with this geju should take public posts and office or paperwork jobs, and live a safe and steady life. If Wenchang, Wenqu and huake also meet it, it means fame that spreads far. What it dreads most is too many baleful stars, which instead mean many changes and little peace.',
  'qs-7-1':
    'When hualu and Lucun meet together in the sanfang sizheng of the minggong, it is called the Shuanglu chaoyuan geju. As the old saying goes, ‘Shuanglu chaoyuan, wealth to rival Tao Zhu’: it means never worrying about money all one’s life, often with both a regular income and windfalls.',
  'qs-7-2':
    'What Shuanglu chaoyuan dreads most is Dikong and Dijie: once they clash with it, the two lu stars become an empty name. It needs Zuofu and Youbi, or Wenchang and Wenqu, before it is a proper geju.',
};

/** Passages rendered as verse: one rhyming couplet per parallel pair. */
export const COUPLET_IDS: ReadonlySet<string> = new Set([
  'gsf-1-2',
  'gsf-3-3',
  'gsf-6-1',
  'gsf-6-2',
  'gsf-6-3',
  'gsf-9-1',
  'gsf-9-2',
  'gsf-9-3',
  'qs-2-2',
]);
