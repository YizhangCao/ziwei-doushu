/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Login page: starts GitHub sign-in through Auth.js. */

import type { Metadata } from 'next';
import { signIn } from '@/auth';

export const metadata: Metadata = {
  title: '登录 · 紫微命盘',
  robots: { index: false },
};

type SearchParams = Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;

/**
 * Returns `value` if it is a same-site path, otherwise `/`, so the login page
 * cannot be used as an open redirect.
 */
function safeCallbackUrl(value: string | string[] | undefined): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

/**
 * Renders the GitHub sign-in form. After sign-in the user returns to
 * `callbackUrl`; an `error` parameter, set by Auth.js on failure, shows a retry
 * message.
 */
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);

  async function loginWithGitHub() {
    'use server';
    await signIn('github', { redirectTo });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card-glass w-full max-w-sm rounded-xl p-8 text-center">
        <h1 className="text-lg font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>
          登录紫微命盘
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--t-faint)' }}>
          使用 GitHub 账号登录后，可以使用 AI 解读，命盘和对话只保存在你自己的账户里。
        </p>
        {error ? (
          <p role="alert" className="mt-4 text-sm" style={{ color: 'var(--t-gold)' }}>
            登录没有成功，请重试。
          </p>
        ) : null}
        <form action={loginWithGitHub} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-full px-4 py-2 text-sm focus:outline-none focus-visible:ring-2"
            style={{ border: '1px solid var(--t-border)', color: 'var(--t-gold)' }}
          >
            使用 GitHub 登录
          </button>
        </form>
      </div>
    </main>
  );
}
