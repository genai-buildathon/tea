"use client";

import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { GraduationCap, User, Crown } from "lucide-react";

export const DifficultyDisplay: React.FC = () => {
  const { mode } = useAdkTest();
  const { t } = useLanguage();

  const getDifficultyInfo = () => {
    switch (mode) {
      case "beginner":
        return {
          label: t("beginner"),
          description: t("beginnerDesc"),
          icon: GraduationCap,
          color: "bg-green-100 text-green-800 border-green-200",
          iconColor: "text-green-600",
        };
      case "intermediate":
        return {
          label: t("intermediate"),
          description: t("intermediateDesc"),
          icon: User,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          iconColor: "text-blue-600",
        };
      case "advanced":
        return {
          label: t("advanced"),
          description: t("advancedDesc"),
          icon: Crown,
          color: "bg-purple-100 text-purple-800 border-purple-200",
          iconColor: "text-purple-600",
        };
      default:
        return {
          label: t("beginner"),
          description: t("beginnerDesc"),
          icon: GraduationCap,
          color: "bg-green-100 text-green-800 border-green-200",
          iconColor: "text-green-600",
        };
    }
  };

  const difficultyInfo = getDifficultyInfo();
  const Icon = difficultyInfo.icon;

  return (
    <div
      className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyInfo.color}`}
    >
      {difficultyInfo.label}
    </div>
  );
};
