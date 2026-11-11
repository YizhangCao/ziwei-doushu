import type { Metadata } from 'next';
import { signIn } from '@/auth';

export const metadata: Metadata = {
  title: '登录 · 紫微命盘',
  robots: { index: false },
};

type SearchParams = Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;

// Only same-site paths, so the login page can't be used as an open redirect.
function safeCallbackUrl(value: string | string[] | undefined): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

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
