/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The rest of the site's copy in the tone of Apple's mainland China site (#94):
 * short two-beat headlines, plain spoken words, the informal you, and facts in the line under
 * the headline. The product owner adopted all 26 drafts on 11/12; S2 closes on "as Ni Haixia
 * said" in Chinese. English terms follow lib/i18n/glossary.ts.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';
import { ALL_BOOKS } from '@/lib/classics';

type Tree = Record<string, unknown>;
const zh = MESSAGES.zh as unknown as Record<string, Tree>;
const en = MESSAGES.en as unknown as Record<string, Tree>;

function at(tree: Record<string, Tree>, path: string): string | undefined {
  let node: unknown = tree;
  for (const part of path.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === 'string' ? node : undefined;
}

/** Item id → [message path, Chinese, English]. */
const ADOPTED: [string, string, string, string][] = [
  ['S1', 'home.walkthrough.title', '一张命盘，四步读懂', 'One chart, read in four steps'],
  ['S2', 'home.walkthrough.lead', '先命宫，再三方四正，再四化，最后大限。倪海厦如是说。',
    'The Life Palace first, then sanfang sizheng, then the Four Transformations, and the Decade last. That is the order Ni Haixia read a chart in.'],
  ['S3', 'home.roadmap.subtitle', '紫微先开，天纪、地纪、人纪随后', 'Ziwei first. Tian Ji, Di Ji and Ren Ji follow.'],
  // 排盘法, not 排盘: 起盘 stays the only verb for building a chart (PRODUCT.md, #63)
  ['S4', 'home.features.0.tag', '排盘法', 'Charting'],
  ['S4', 'home.features.1.tag', '命盘', 'The chart'],
  ['S4', 'home.features.2.tag', 'AI 解读', 'AI reading'],
  ['S5', 'home.features.1.title', '十四主星，\n一颗不少', 'All 14 Main Stars.\nNot one missing.'],
  ['S6', 'home.features.1.subtitle', '主星、辅星、四化，同屏看清', 'Main Stars, Secondary Stars and the Four Transformations, all on one screen'],
  ['S7', 'home.features.1.points.0', '十四主星各入其宫，彼此关系看得清', 'Each of the 14 Main Stars in its palace, with how they relate in plain view'],
  ['S7', 'home.features.1.points.1', '辅星、煞星同屏显示，关键信息一个不漏', 'Secondary Stars and Baleful Stars on the same screen, nothing important left out'],
  ['S7', 'home.features.1.points.2', '庙旺利陷标在星名旁，强弱一看便知', 'Brightness grades (Miao, Wang, Li, Xian) beside each star name, so strong and weak show at a glance'],
  ['S8', 'home.features.2.points.0', '命格：从命宫主星读起，连同三方四正，讲清你的性格和人生格局',
    'Your character: read from the Main Stars of your Life Palace, together with its sanfang sizheng'],
  ['S9', 'home.features.2.points.1', '六个主题，一点就换：命格、性格、事业、感情、财运、健康',
    'Six topics, one tap apart: overview, personality, career, love, wealth and health'],
  ['S10', 'home.features.2.points.3', '追问：哪里没看懂，就接着问，比如「命宫没有主星，怎么看？」',
    'Follow-ups: ask about anything you didn’t follow, like “My Life Palace has no main star. How do I read it?”'],
  ['S11', 'home.trinity.intro', '命盘不是人生的全部。<br></br>倪海厦把影响人生的力量分成三份：天、地、人。',
    'A chart is not your whole life.<br></br>Ni Haixia divided what shapes a life into three parts: heaven, earth and people.'],
  ['S12', 'home.trinity.cards.0.desc', '出生那一刻，星曜落在哪一宫、五行局是几局、命宫坐哪颗星，就已经定了。这是人生的底色，只占三分之一。',
    'The moment you are born fixes where the stars fall, your Five Phases Configuration and the Main Stars of your Life Palace. That is the base of a life, and only a third of it.'],
  ['S13', 'home.trinity.cards.1.desc', '生在哪座城、哪个家，住在怎样的环境，是另外三分之一。同一张命盘，换个地方，际遇可以完全不同。',
    'The city and family you are born into, and the place you live, make up another third. The same chart can lead to very different lives in different places.'],
  ['Q1', 'chart.lead', '填好生辰，几秒排好你的十二宫。', 'Fill in your birth details, and your twelve palaces are laid out in seconds.'],
  ['Q2', 'board.hint', '点任一宫位，看它的三方四正。', 'Tap any palace to see its sanfang sizheng.'],
  ['Q3', 'birthForm.submitting', '正在起盘…', 'Building your chart…'],
  ['H1', 'heming.followUpTitle', '接着问', 'Ask more'],
  ['K1', 'knowledge.kicker', '依倪海厦《天纪》，附古籍出处', 'After Ni Haixia’s Tian Ji, with classical sources'],
  ['K2', 'knowledge.preparing', '专题还在写。先去看看<link>古籍原典库</link>', 'Topics are still being written. Start with the <link>Classics Library</link>'],
  ['K3', 'knowledge.topic.ctaBody', '填好生辰，几秒起盘，AI 从命宫读起。',
    'Fill in your birth details, build your chart in seconds, and AI reads it from the Life Palace out.'],
  ['G1', 'library.kicker', '紫微斗数的三部古籍', 'Three classics of Ziwei Doushu'],
  ['G2', 'library.count', '{books} 部古籍，{paragraphs} 段要义，逐段可查。各段为今人整理。',
    '{books, plural, one {# classic} other {# classics}}, {paragraphs, plural, one {# passage} other {# passages}}, each one searchable. The passages are modern summaries.'],
  ['G3', 'library.open', '阅读', 'Read'],
  ['G4', 'library.search.none', '没有找到这个词。', 'No passages match.'],
  ['G4', 'library.search.tryAgain', '换个词试试：', 'Try one of these:'],
  ['G5', 'library.search.empty', '输入一个词，开始搜索', 'Type a word to search'],
  ['N1', 'notFound.title', '这一页找不到了', 'We can’t find this page'],
  ['N1', 'notFound.body', '链接可能失效了，也可能内容还在整理。', 'The link may be broken, or the page is still being written.'],
];

describe('the adopted drafts in Apple China\'s tone', () => {
  for (const [id, path, zhText, enText] of ADOPTED) {
    it(`${id} ${path}`, () => {
      expect(at(zh, path)).toBe(zhText);
      expect(at(en, path)).toBe(enText);
    });
  }

  it('G1 names as many classics as the library holds', () => {
    expect(ALL_BOOKS).toHaveLength(3); // the kicker says three classics in words; change both together
  });

  it('G4 keeps the plain "try" for an empty search', () => {
    expect(at(zh, 'library.search.try')).toBe('可以试试：');
    expect(at(en, 'library.search.try')).toBe('Try:');
  });
});
