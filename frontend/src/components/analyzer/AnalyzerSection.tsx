"use client";
import React from "react";
import Image from "next/image";
import { CameraSection } from "./CameraSection";
import { useLanguage } from "@/contexts/LanguageContext";

export const AnalyzerSection = () => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <div className="text-gray-600 mb-4 px-8 text-sm font-bold">
        {t("analyzerDescription")}
      </div>
      <div
        className={`relative h-full w-full flex-1 flex flex-col items-center justify-center`}
      >
        {/* Tearoom背景画像 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/Tearoom.png"
            alt="Traditional Japanese Tearoom"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>
        {/* オーバーレイで少し暗くして、テキストを読みやすくする */}
        <div className="absolute inset-0 bg-white/50" />
        {/* コンテンツ */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <CameraSection />
        </div>
      </div>
    </div>
  );
};
