/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Section 6 of the terms (#100): California law, with an arbitration clause,
 * as the product owner approved it on 11/12. Each of the nine parts is pinned word for word
 * in both languages, so a change to the legal text is always deliberate. Not legal advice:
 * the text should be reviewed by a California-licensed attorney before launch.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

type Law = Record<string, string | undefined>;
const law = (locale: 'zh' | 'en') =>
  (MESSAGES[locale].legal as unknown as { terms: { law: Law } }).terms.law;

/** Part → [Chinese, English]. Titles are bold through the <strong> tag. */
const PARTS: [string, string, string][] = [
  ['a',
    '<strong>（a）适用法律。</strong>本节中的「我们」指本站的运营者。本条款受美国加利福尼亚州法律管辖，并依其解释，不适用其冲突法规则。本节中的仲裁条款受美国《联邦仲裁法》管辖。',
    '<strong>(a) Governing law.</strong> In this section, “we” means the operator of this site. These Terms are governed by and construed under the laws of the State of California, United States, without regard to its conflict-of-laws rules. The Federal Arbitration Act governs the arbitration provisions in this section.'],
  ['b',
    '<strong>（b）先行协商。</strong>因本条款或本站引起或与之相关的争议，双方应先友好协商。提出争议的一方应书面通知另一方并说明争议内容；联系我们的方式见第 7 节。通知送达后 60 日内未能解决的，任何一方可以按下列方式提起仲裁。',
    '<strong>(b) Informal resolution first.</strong> If a dispute arises from or relates to these Terms or this site, the parties shall first try to settle it amicably. The party raising the dispute shall send the other a written notice describing it; you can reach us at the contact details in Section 7. If the dispute is not resolved within 60 days after the notice is received, either party may start arbitration as described below.'],
  ['c',
    '<strong>（c）有约束力的仲裁。</strong>除（e）项所列情形外，未解决的争议由美国仲裁协会（AAA）按其届时有效的《消费者仲裁规则》，由一名仲裁员以个人仲裁方式作出终局裁决。仲裁可以通过视频或电话进行，也可以在加利福尼亚州旧金山县现场进行；你住在美国的，也可以在你居住的县进行。仲裁员可以给予法院在个案中能够给予的同等救济。裁决可以向任何有管辖权的法院申请确认。',
    '<strong>(c) Binding arbitration.</strong> Except as provided in (e), any unresolved dispute shall be finally resolved by binding individual arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules then in effect, before a single arbitrator. Hearings may be held by video or telephone, or in person in San Francisco County, California, or, if you live in the United States, in the county where you live. The arbitrator may award the same individual relief a court could. Judgment on the award may be entered in any court with jurisdiction.'],
  ['d',
    '<strong>（d）费用。</strong>AAA 的立案费、管理费和仲裁员报酬中，超出你向法院起诉所需费用的部分，由我们承担，并按加州法律的要求按时支付。双方各自承担律师费，适用法律或 AAA 规则另有规定的除外。',
    '<strong>(d) Fees.</strong> We will pay all AAA filing, administrative and arbitrator fees beyond what you would pay to file a claim in court, and we will pay them on time as California law requires. Each party bears its own attorneys’ fees unless applicable law or the AAA rules provide otherwise.'],
  ['e',
    '<strong>（e）例外。</strong>符合条件的个人请求，任何一方可以向小额法庭起诉。依加州法律请求公共禁令救济的，可以向法院起诉，该诉讼在可仲裁的请求裁决之前中止。本节不影响你依所在地法律享有、且不能以合同排除的消费者权利。',
    '<strong>(e) Exceptions.</strong> Either party may bring a qualifying individual claim in small claims court. A claim for public injunctive relief under California law may be brought in court, and it shall be stayed until the arbitrable claims are decided. Nothing in this section limits any consumer rights you have under the laws of your place of residence that cannot be waived by contract.'],
  ['f',
    '<strong>（f）不得提起集体诉讼。</strong>在法律允许的范围内，请求只能以个人名义提出，不得以集体诉讼、共同诉讼或代表诉讼的原告或成员身份提出；仲裁员不得合并多人的请求。如本项对某一请求被认定无效，该请求应向法院提起，而不是进行集体仲裁。',
    '<strong>(f) No class actions.</strong> To the extent permitted by law, claims may be brought only individually, not as a plaintiff or class member in any purported class, collective or representative proceeding, and the arbitrator may not consolidate the claims of more than one person. If this paragraph is found unenforceable for a claim, that claim shall proceed in court, not in class arbitration.'],
  ['g',
    '<strong>（g）退出仲裁的权利。</strong>本条款生效后你首次使用本站之日起 30 日内，你可以按第 7 节的邮箱给我们发邮件，写明你的姓名和退出仲裁的意思，即可退出本仲裁约定。退出不影响本条款的其他部分。',
    '<strong>(g) Your right to opt out.</strong> You may opt out of this arbitration agreement by emailing us at the address in Section 7, within 30 days after you first use this site after these Terms take effect, with your name and a statement that you opt out of arbitration. Opting out does not affect any other part of these Terms.'],
  ['h',
    '<strong>（h）法院管辖。</strong>未经仲裁的争议，应向位于加利福尼亚州旧金山县的州法院或联邦法院提起，双方同意接受上述法院的管辖。这包括小额诉讼、公共禁令救济、已退出仲裁者的请求，以及申请确认或撤销仲裁裁决的诉讼。',
    '<strong>(h) Courts.</strong> Any dispute that is not arbitrated shall be brought in the state or federal courts located in San Francisco County, California, and both parties consent to the jurisdiction of those courts. That includes small claims, public injunctive relief, the claims of anyone who opted out, and actions to confirm or set aside an award.'],
  ['i',
    '<strong>（i）可分割性。</strong>本节任何部分被认定无效的，其余部分继续有效，（f）项另有规定的除外。',
    '<strong>(i) Severability.</strong> If any part of this section is found unenforceable, the rest remains in effect, except as stated in (f).'],
];

describe('terms section 6: California law and arbitration', () => {
  it('is renamed in both languages', () => {
    expect(law('zh').heading).toBe('6. 法律适用、仲裁与争议解决');
    expect(law('en').heading).toBe('6. Governing Law, Arbitration and Dispute Resolution');
  });

  for (const [part, zhText, enText] of PARTS) {
    it(`part (${part}) reads as approved`, () => {
      expect(law('zh')[part]).toBe(zhText);
      expect(law('en')[part]).toBe(enText);
    });
  }

  it('no longer carries the old one-paragraph body under PRC law', () => {
    expect(law('zh').body).toBeUndefined();
    expect(law('en').body).toBeUndefined();
    expect(JSON.stringify(MESSAGES.zh.legal)).not.toContain('中华人民共和国');
    expect(JSON.stringify(MESSAGES.en.legal)).not.toContain('People’s Republic of China');
  });
});
