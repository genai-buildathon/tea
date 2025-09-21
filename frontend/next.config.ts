import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ハイドレーションエラーを抑制（開発環境のみ）
  experimental: {
    suppressHydrationWarning: true,
  },

  // ブラウザ拡張機能による属性変更を考慮
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
