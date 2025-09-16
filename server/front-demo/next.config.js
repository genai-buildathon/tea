/** @type {import('next').NextConfig} */
const BACKEND_BASE = process.env.BACKEND_BASE || 'https://tea-server-760751063280.us-central1.run.app';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: false, // better for SSE pass-through in dev
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_BASE}/:path*`
      }
    ];
  }
};

module.exports = nextConfig;

