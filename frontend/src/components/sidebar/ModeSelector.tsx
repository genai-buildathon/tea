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
      activeColor:
        "bg-green-600 border-green-600 ring-2 ring-green-300 ring-offset-2",
      inactiveColor:
        "bg-gray-100 border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700",
    },
    {
      id: "intermediate",
      label: t("intermediate"),
      icon: User,
      description: t("intermediateDesc"),
      color: "bg-blue-500 hover:bg-blue-600 border-blue-500",
      activeColor:
        "bg-blue-600 border-blue-600 ring-2 ring-blue-300 ring-offset-2",
      inactiveColor:
        "bg-gray-100 border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700",
    },
    {
      id: "advanced",
      label: t("advanced"),
      icon: Crown,
      description: t("advancedDesc"),
      color: "bg-purple-500 hover:bg-purple-600 border-purple-500",
      activeColor:
        "bg-purple-600 border-purple-600 ring-2 ring-purple-300 ring-offset-2",
      inactiveColor:
        "bg-gray-100 border-gray-300 text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700",
    },
  ];

  return (
    <div className="">
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
                flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 transform
                ${
                  isActive
                    ? `${mode.activeColor} text-white shadow-lg scale-105`
                    : `${mode.inactiveColor} shadow-sm hover:shadow-md hover:scale-102`
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
      <div className="mt-3 text-center">
        <div className="bg-white rounded-md px-3 py-2 border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-700 mb-1">
            {t("analysisLevel")}:{" "}
            {modes.find((m) => m.id === currentMode)?.label}
          </div>
          <div className="text-xs text-gray-500">
            {modes.find((m) => m.id === currentMode)?.description ||
              t("selectMode")}
          </div>
        </div>
      </div>
    </div>
  );
};
