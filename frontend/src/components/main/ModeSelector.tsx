"use client";
import React from "react";
import { GraduationCap, User, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ModeSelectorProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  isLoading?: boolean;
}

/**
 * モード切り替えコンポーネント
 * 初心者・中級者・上級者モードを切り替え
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const modes = [
    {
      id: "beginner",
      label: t("beginner"),
      icon: GraduationCap,
      description: t("beginnerDesc"),
      color: "bg-green-500 hover:bg-green-600 border-green-500",
      activeColor: "bg-green-600 border-green-600",
    },
    {
      id: "intermediate",
      label: t("intermediate"),
      icon: User,
      description: t("intermediateDesc"),
      color: "bg-blue-500 hover:bg-blue-600 border-blue-500",
      activeColor: "bg-blue-600 border-blue-600",
    },
    {
      id: "advanced",
      label: t("advanced"),
      icon: Crown,
      description: t("advancedDesc"),
      color: "bg-green-500 hover:bg-green-600 border-green-500",
      activeColor: "bg-green-600 border-green-600",
    },
  ];

  return (
    <div className="p-3 border-b border-gray-200 bg-gray-50">
      <div className="mb-2">
        <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {t("analysisLevel")}
        </h4>
      </div>
      <div className="flex space-x-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              disabled={isLoading}
              className={`
                flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200
                ${
                  isActive
                    ? `${mode.activeColor} text-white shadow-md`
                    : `${mode.color} text-white opacity-70 hover:opacity-100`
                }
                ${
                  isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }
              `}
              title={mode.description}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* 現在のモードの説明 */}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          {modes.find((m) => m.id === currentMode)?.description ||
            t("selectMode")}
        </span>
      </div>
    </div>
  );
};
