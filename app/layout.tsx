import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { ThemeProvider } from '@/components/ThemeProvider';
import MotionProvider from '@/components/MotionProvider';
import SiteNav from '@/components/SiteNav';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';
import { HTML_LANG } from '@/lib/i18n/locale';
import type { Messages } from '@/messages';

// Only what client components read is serialized into the page (#59); the legal,
// knowledge and metadata text stay on the server.
const CLIENT_NAMESPACES = ['nav', 'auth', 'home', 'chart', 'birthForm', 'board', 'timeNav', 'insight', 'heming', 'library'] as const;

// Title, description and Open Graph follow the visitor's language (#59).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return {
  title: t('title'),
  description: t('description'),
  keywords: t('keywords'),
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: t('title'),
    description: t('description'),
    url: SITE_URL,
    siteName: t('siteName'),
    locale: t('ogLocale'),
    type: 'website',
  },
  // 站长平台验证（拿到 verification code 后填入对应字段，重新部署即可）
  verification: {
    // Google Search Console: 在 https://search.google.com/search-console 添加站点后获取
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    // Bing Webmaster Tools: 在 https://www.bing.com/webmasters 添加站点后获取
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '808FFC6023A2C359B375DD860FEDA856',
      // 百度站长（等执照下来后）
      'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
      // 360 站长（等执照下来后）
      '360-site-verification': process.env.NEXT_PUBLIC_360_VERIFICATION || '',
    },
  },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = (await getMessages()) as Messages;
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]));
  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={clientMessages}>
          <ThemeProvider>
            <SessionProvider>
              <MotionProvider>
                {/* 全站唯一的导航（#57）；账号入口 UserMenu 在导航里（#15） */}
                <SiteNav />
                {children}
              </MotionProvider>
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
