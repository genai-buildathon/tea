"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SummaryList } from "@/components/chat/SummaryList";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { Database } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * 履歴セクションコンポーネント
 * 保存された要約の履歴を表示
 */
export const HistorySection = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center px-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center px-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Database className="w-16 h-16 mx-auto text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {t("savedHistory")}
          </h2>
          <p className="text-gray-600 text-sm mb-4">{t("loginRequired")}</p>
          <GoogleLoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <div className="flex-1 px-4 pb-6">
        <SummaryList userId={user.uid} className="h-full" />
      </div>
    </div>
  );
};
