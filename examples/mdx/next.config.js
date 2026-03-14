/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // تحسين أداء المسارات للعالمية
  i18n: {
    locales: ['ar', 'en'],
    defaultLocale: 'ar',
  },
  // ضمان أرشفة الروابط بشكل صحيح
  trailingSlash: true,
}

module.exports = nextConfig
