/**
 * @fileoverview The privacy policy describes the site that ships with sign-in (#15), saved charts
 * (#18), saved conversations (#22) and consultations (#21), not the earlier one that stored
 * nothing (review on #64). Checked in both languages.
 */

import { describe, it, expect } from 'vitest';
import { MESSAGES } from '@/messages';

const OLD_CLAIMS = [
  '不在服务器上保存',
  '目前不需要注册',
  '没有需要查询、导出或删除',
  'does not store',
  'no sign-up is needed',
  'no personal data to access',
];

describe('privacy policy text', () => {
  it('no longer says the server stores nothing', () => {
    const text = JSON.stringify([MESSAGES.zh.legal.privacy, MESSAGES.en.legal.privacy]);
    for (const claim of OLD_CLAIMS) expect(text, claim).not.toContain(claim);
  });

  it.each(['zh', 'en'] as const)('%s: says what is stored, how it is protected, and how to delete it', (locale) => {
    const p = MESSAGES[locale].legal.privacy;
    // Sign-in data, and API keys kept only as hashes.
    expect(p.collect.account).toContain('GitHub');
    expect(p.collect.account).toMatch(/哈希|hash/);
    // Saved charts and conversations are stored encrypted.
    expect(p.security.body).toContain('AES-256-GCM');
    // A practitioner the member shares with sees that chart.
    expect(p.sharing.intro).toMatch(/命理师|practitioner/);
    // The database and sign-in providers are named.
    expect(p.sharing.hosting).toContain('Neon');
    expect(p.sharing.hosting).toContain('GitHub');
    // Members can delete saved charts; account deletion goes through the contact details.
    expect(p.rights.server).toMatch(/删除|delete/);
    // The sign-in cookie is disclosed.
    expect(p.cookies.body).toContain('authjs.session-token');
  });
});
