"use client";
import React from "react";
import { Eye, EyeOff } from "lucide-react";

interface AnalysisOverlayToggleFABProps {
  isAnalysisVisible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * 解析オーバーレイの表示/非表示を切り替えるFABボタン
 * 画面右下に固定配置される
 */
export const AnalysisOverlayToggleFAB: React.FC<
  AnalysisOverlayToggleFABProps
> = ({ isAnalysisVisible, onToggle, disabled = false }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        fixed bottom-6 right-6 z-30
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-4 focus:ring-blue-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isAnalysisVisible
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
        }
        transform hover:scale-110 active:scale-95
      `}
      title={isAnalysisVisible ? "解析結果を閉じる" : "解析結果を表示"}
    >
      {isAnalysisVisible ? (
        <EyeOff className="w-6 h-6" />
      ) : (
        <Eye className="w-6 h-6" />
      )}
    </button>
  );
};
