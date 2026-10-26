/** @type {import('next').NextConfig} */
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Brauzer faqat frontend domeniga murojaat qiladi: /api/* backendga proksi qilinadi (CORS kerak emas,
  // rasmlar ham shu domen ostida — Telegram havola ko'rinishida (og:image) to'g'ri chiqadi)
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
