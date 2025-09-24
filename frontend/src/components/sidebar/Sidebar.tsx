"use client";
import React from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { UserProfile } from "@/components/sidebar/UserProfile";
import { ModeSelector } from "@/components/sidebar/ModeSelector";
import { useAdk } from "@/contexts/AdkContext";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogoutButton } from "@/components/sidebar/LogoutButton";

interface SidebarProps {
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const { isOpen, closeSidebar } = useSidebar();
  const { mode, setMode } = useAdk();
  const { t } = useLanguage();

  // モード変更ハンドラー
  const handleModeChange = async (newMode: string) => {
    setMode(newMode);
  };

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* サイドバー */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* サイドバーヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{t("menu")}</h2>

            <button
              onClick={closeSidebar}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t("closeSidebar")}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {/* ユーザープロフィール */}
          <div className="p-4 ">
            <UserProfile
              className="w-full"
              variant="vertical"
              showLogoutButton={true}
            />
          </div>

          {/* サイドバーコンテンツ */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 言語選択 */}

            <LanguageSelector />

            {/* モード選択 */}
            <ModeSelector currentMode={mode} onModeChange={handleModeChange} />

            {/* ログアウトボタン */}
            <div className="">
              <LogoutButton variant="text" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
