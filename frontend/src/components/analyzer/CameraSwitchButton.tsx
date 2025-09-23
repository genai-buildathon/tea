"use client";
import React from "react";
import { RotateCcw } from "lucide-react";

interface CameraSwitchButtonProps {
  /** カメラ切り替えハンドラー */
  onSwitchCamera: () => void;
  /** カメラが使用可能かどうか */
  disabled?: boolean;
  /** 現在のカメラタイプ（front/back） */
  currentCamera: "front" | "back";
  /** ボタンのサイズ */
  size?: "sm" | "md" | "lg";
  /** 追加のクラス名 */
  className?: string;
}

/**
 * カメラ切り替えボタンコンポーネント
 * フロントカメラとバックカメラの切り替えを行う
 */
export const CameraSwitchButton: React.FC<CameraSwitchButtonProps> = ({
  onSwitchCamera,
  disabled = false,
  currentCamera,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "p-2 w-8 h-8",
    md: "p-3 w-10 h-10",
    lg: "p-4 w-12 h-12",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getCameraText = () => {
    return currentCamera === "front"
      ? "背面カメラに切り替え"
      : "前面カメラに切り替え";
  };

  return (
    <button
      onClick={onSwitchCamera}
      disabled={disabled}
      className={`
        bg-gray-700/90 text-white rounded-full
        hover:bg-gray-600/90 focus:outline-none focus:ring-2 
        focus:ring-gray-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 shadow-lg
        ${sizeClasses[size]}
        ${className}
      `}
      title={getCameraText()}
      aria-label={getCameraText()}
    >
      <RotateCcw
        className={`${iconSizes[size]} ${
          disabled ? "" : "group-hover:rotate-180"
        } transition-transform duration-300`}
      />
    </button>
  );
};
