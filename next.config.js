const createNextIntlPlugin = require('next-intl/plugin');

// next-intl reads the locale and messages from i18n/request.ts (#59).
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
};

module.exports = withNextIntl(nextConfig);
