"use client";
import React, { useState, useEffect } from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { RefreshCw, Clock, AlertTriangle } from "lucide-react";

interface SmartRetryButtonProps {
  onRetry: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * スマート再試行ボタンコンポーネント
 * レート制限を考慮した再試行間隔の表示と制御
 */
export const SmartRetryButton: React.FC<SmartRetryButtonProps> = ({
  onRetry,
  disabled = false,
  className = "",
}) => {
  const { retryCount, lastRetryTime } = useAdkTest();
  const [countdown, setCountdown] = useState(0);
  const [canRetry, setCanRetry] = useState(true);

  // 再試行可能になるまでの時間を計算
  const calculateWaitTime = () => {
    const now = Date.now();
    const timeSinceLastRetry = now - lastRetryTime;
    const minInterval = Math.min(1000 * Math.pow(2, retryCount), 30000); // 最大30秒
    const remainingTime = Math.max(0, minInterval - timeSinceLastRetry);
    return Math.ceil(remainingTime / 1000);
  };

  useEffect(() => {
    const updateCountdown = () => {
      const waitTime = calculateWaitTime();
      setCountdown(waitTime);
      setCanRetry(waitTime === 0 && retryCount < 5);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [retryCount, lastRetryTime]);

  const handleRetry = () => {
    if (canRetry && !disabled) {
      onRetry();
    }
  };

  const getButtonConfig = () => {
    if (retryCount >= 5) {
      return {
        icon: AlertTriangle,
        text: "制限到達",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
        hoverColor: "hover:bg-red-200",
        disabled: true,
      };
    }

    if (countdown > 0) {
      return {
        icon: Clock,
        text: `待機中 (${countdown}s)`,
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
        hoverColor: "hover:bg-yellow-200",
        disabled: true,
      };
    }

    return {
      icon: RefreshCw,
      text: retryCount > 0 ? `再試行 (${retryCount}/5)` : "再試行",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-200",
      disabled: false,
    };
  };

  const config = getButtonConfig();
  const ButtonIcon = config.icon;
  const isDisabled = disabled || config.disabled;

  return (
    <button
      onClick={handleRetry}
      disabled={isDisabled}
      className={`
        inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border transition-colors
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : config.hoverColor}
        ${className}
      `}
      title={
        retryCount >= 5
          ? "最大再試行回数に達しました"
          : countdown > 0
          ? `${countdown}秒後に再試行可能`
          : "接続を再試行"
      }
    >
      <ButtonIcon
        className={`w-3 h-3 mr-1 ${
          config.icon === RefreshCw && !isDisabled ? "animate-spin" : ""
        }`}
      />
      {config.text}
    </button>
  );
};

/**
 * 再試行状態表示コンポーネント
 * 現在の再試行状況を詳細に表示
 */
export const RetryStatus: React.FC = () => {
  const { retryCount, lastRetryTime } = useAdkTest();

  if (retryCount === 0) return null;

  const timeSinceLastRetry = Date.now() - lastRetryTime;
  const nextInterval = Math.min(1000 * Math.pow(2, retryCount), 30000);
  const timeUntilNext = Math.max(0, nextInterval - timeSinceLastRetry);

  return (
    <div className="text-xs text-gray-500 mt-2">
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500" />
          <span>再試行: {retryCount}/5</span>
        </div>
        {timeUntilNext > 0 && (
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-blue-500" />
            <span>次回: {Math.ceil(timeUntilNext / 1000)}秒後</span>
          </div>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-400">
        指数バックオフ: {Math.ceil(nextInterval / 1000)}秒間隔
      </div>
    </div>
  );
};
