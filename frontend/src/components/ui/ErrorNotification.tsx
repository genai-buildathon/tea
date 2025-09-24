"use client";
import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { SmartRetryButton, RetryStatus } from "./SmartRetryButton";

interface ErrorNotificationProps {
  error: string | null;
  onDismiss: () => void;
  onRetry?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

/**
 * エラー通知コンポーネント
 * リソース制限エラーなどの重要なエラーを表示
 */
export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  autoHide = false,
  autoHideDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);

      if (autoHide) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // アニメーション完了後に実際に削除
  };

  const isResourceExhaustedError =
    error?.includes("RESOURCE_EXHAUSTED") ||
    error?.includes("Maximum concurrent sessions");
  const isRateLimitError =
    error?.includes("Too Many Requests") || error?.includes("レート制限");

  if (!error) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`rounded-lg shadow-lg border-l-4 p-4 ${
          isResourceExhaustedError
            ? "bg-red-50 border-red-400"
            : isRateLimitError
            ? "bg-orange-50 border-orange-400"
            : "bg-yellow-50 border-yellow-400"
        }`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle
              className={`w-5 h-5 ${
                isResourceExhaustedError
                  ? "text-red-400"
                  : isRateLimitError
                  ? "text-orange-400"
                  : "text-yellow-400"
              }`}
            />
          </div>

          <div className="ml-3 flex-1">
            <h3
              className={`text-sm font-medium ${
                isResourceExhaustedError
                  ? "text-red-800"
                  : isRateLimitError
                  ? "text-orange-800"
                  : "text-yellow-800"
              }`}
            >
              {isResourceExhaustedError
                ? "リソース制限エラー"
                : isRateLimitError
                ? "レート制限エラー"
                : "接続エラー"}
            </h3>

            <div
              className={`mt-1 text-sm ${
                isResourceExhaustedError
                  ? "text-red-700"
                  : isRateLimitError
                  ? "text-orange-700"
                  : "text-yellow-700"
              }`}
            >
              {isResourceExhaustedError ? (
                <div>
                  <p>最大同時セッション数に達しています。</p>
                  <p className="mt-1 text-xs">
                    既存の接続を切断してから再試行してください。
                  </p>
                </div>
              ) : isRateLimitError ? (
                <div>
                  <p>リクエスト頻度が高すぎます。</p>
                  <p className="mt-1 text-xs">
                    自動的に再試行間隔を調整します。
                  </p>
                </div>
              ) : (
                <p>{error}</p>
              )}
            </div>

            {onRetry && (
              <div className="mt-3 space-y-2">
                <SmartRetryButton onRetry={onRetry} />
                <RetryStatus />
              </div>
            )}
          </div>

          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className={`inline-flex rounded-md p-1.5 transition-colors ${
                isResourceExhaustedError
                  ? "text-red-400 hover:bg-red-100"
                  : isRateLimitError
                  ? "text-orange-400 hover:bg-orange-100"
                  : "text-yellow-400 hover:bg-yellow-100"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
