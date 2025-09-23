"use client";
import React from "react";
import { useNav } from "@/contexts/NavContext";
import { NavTabItem } from "@/components/ui/NavTabItem";
import { ChasenIconGreen } from "../ui/ChasenLogo";
import { useLanguage } from "@/contexts/LanguageContext";

// ナビゲーションバー（スマホ）
export const NavBar = () => {
  const { activeTab, setActiveTab } = useNav();
  const { t } = useLanguage();

  return (
    <nav className="flex w-full bg-white border-t border-gray-200 shadow-sm">
      <div className="flex-1">
        <NavTabItem
          icon={
            <ChasenIconGreen
              size={40}
              color={activeTab === "analyzer" ? "green" : "gray"}
            />
          }
          label={t("analyzerTab")}
          isActive={activeTab === "analyzer"}
          onClick={() => setActiveTab("analyzer")}
        />
      </div>
      <div className="flex-1">
        <NavTabItem
          icon={
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
          }
          label={t("historyTab")}
          isActive={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
      </div>
    </nav>
  );
};
