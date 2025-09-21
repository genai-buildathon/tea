"use client";
import { useEffect, useState } from "react";

/**
 * ハイドレーション完了を検知するカスタムフック
 * SSRとクライアントサイドの不一致を防ぐために使用
 */
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // ハイドレーション完了をマーク
    setIsHydrated(true);
  }, []);

  return isHydrated;
};
