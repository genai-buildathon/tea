"use client";
import dynamic from "next/dynamic";
import React from "react";

/**
 * SSRを無効にしてクライアントサイドでのみレンダリングするコンポーネント
 * ハイドレーションエラーを回避するために使用
 */
const NoSSR: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// SSRを無効にしてエクスポート
export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
    </div>
  ),
});
