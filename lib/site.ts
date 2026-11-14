/**
 * 站点根地址。部署时在 .env.local 里配置 NEXT_PUBLIC_SITE_URL（见 .env.example）；
 * 未配置时用本机开发地址，避免 fork 部署后把 sitemap、canonical 指向别人的域名。
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/**
 * How visitors reach the site's owner (#90). The terms and the classics library both show
 * these, so they live in one place; the message files only hold {wechat} and {email}.
 */
export const CONTACT = { wechat: 'lyk1121762110', email: 'liu.yika@northeastern.edu' } as const;

/** 只取域名部分，用于界面上展示（如分享卡底部） */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
