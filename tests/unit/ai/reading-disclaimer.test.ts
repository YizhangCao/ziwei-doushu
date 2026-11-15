/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The reading disclaimer (#11): the AI is told not to give medical, legal or
 * financial advice and to flag family readings, the topic prompts no longer ask for that advice,
 * and the panel's two notes read as drafted for the product owner on 11/12.
 */

import { describe, it, expect } from 'vitest';
import { systemPrompt } from '@/lib/ai/interpret';
import { MESSAGES } from '@/messages';

const ZH_RULE =
  '不要给医疗、法律或财务方面的具体建议；遇到这类问题，请对方去问医生、律师或持证的理财顾问。谈到父母、兄弟、子女等六亲时，说明斗数看六亲较弱，这部分仅供参考。';
const EN_RULE =
  'Don’t give specific medical, legal or financial advice; for those questions, suggest a doctor, a lawyer or a licensed financial adviser. When the reading touches on parents, siblings or children, say that Ziwei Doushu is weaker at reading family ties, so that part is for reference only.';

type Insight = { prompts: Record<string, string>; note?: Record<string, string> };
const insight = (locale: 'zh' | 'en') => MESSAGES[locale].insight as unknown as Insight;

describe('the system prompt (#11)', () => {
  it('tells the AI not to give medical, legal or financial advice, in both languages', () => {
    expect(systemPrompt('zh')).toContain(ZH_RULE);
    expect(systemPrompt('en')).toContain(EN_RULE);
  });
});

describe('the topic prompts (#11)', () => {
  it('ask about money without asking for financial advice', () => {
    expect(insight('zh').prompts.wealth).not.toContain('具体的财务建议');
    expect(insight('zh').prompts.wealth).toContain('**【理财方向】**\n值得留意的方向和风险，不作具体的投资建议。');
    expect(insight('en').prompts.wealth).not.toContain('Concrete financial advice');
    expect(insight('en').prompts.wealth).toContain(
      '**【Money matters】**\nDirections worth watching and risks to keep in mind, without specific investment advice.',
    );
  });

  it('ask about health without asking for medical advice', () => {
    expect(insight('zh').prompts.health).not.toContain('预防建议');
    expect(insight('zh').prompts.health).toContain('**【日常留意】**\n生活上值得留意的地方，不代替医生的诊断。');
    expect(insight('en').prompts.health).not.toContain('Prevention');
    expect(insight('en').prompts.health).toContain(
      '**【Everyday care】**\nThings worth watching day to day. This does not replace a doctor’s advice.',
    );
  });
});

describe('the notes under a reading (#11)', () => {
  it('say every reading is for reference only', () => {
    expect(insight('zh').note?.reference).toBe('以上依命盘结构解读，仅供参考。');
    expect(insight('en').note?.reference).toBe('This reading follows the structure of the chart. It is for reference only.');
  });

  it('say family readings are weaker, as the README does', () => {
    expect(insight('zh').note?.family).toBe('紫微斗数看父母、兄弟、子女这些六亲，本来就比较弱。这部分只作参考。');
    expect(insight('en').note?.family).toBe(
      'Ziwei Doushu is weaker at reading family ties such as parents, siblings and children. Take this part as a reference only.',
    );
  });
});
