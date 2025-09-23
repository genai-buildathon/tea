import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Docker用のstandalone出力設定
  output: "standalone",

  // ブラウザ拡張機能による属性変更を考慮
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
