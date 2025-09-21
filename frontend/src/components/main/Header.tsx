"use client";
import React from "react";
import { ChasenLogo } from "./ChasenLogo";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  const { t } = useLanguage();

  return (
    <header className="flex items-center justify-between py-4 px-6 w-full">
      <div className="flex items-center gap-2">
        <ChasenLogo />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-800 font-noto-serif-jp">
            {t("appTitle")}
          </h1>
          <p className="text-xs text-gray-600 font-noto-serif-jp">
            {t("appSubtitle")}
          </p>
        </div>
      </div>

      {/* メニューアイコン */}
      <MenuIcon
        isOpen={isOpen}
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      />
    </header>
  );
};
