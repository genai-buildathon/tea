"use client";
import React from "react";
import { TearoomBackground } from "../main/TearoomBackground";
import { CameraSection } from "./CameraSection";
import { useLanguage } from "@/contexts/LanguageContext";

export const AnalyzerSection = () => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <div className="text-gray-600 mb-4 px-8 text-sm font-bold">
        {t("analyzerDescription")}
      </div>
      <TearoomBackground className="flex-1 flex flex-col items-center justify-center">
        <CameraSection />
      </TearoomBackground>
    </div>
  );
};
