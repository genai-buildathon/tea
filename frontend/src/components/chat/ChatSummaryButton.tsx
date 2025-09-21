"use client";
import React, { useState } from "react";
import { FileText, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatSummaryButtonProps {
  onSummarize: () => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  messageCount: number;
  className?: string;
  language?: string;
}

/**
 * チャット要約ボタンコンポーネント
 * チャット履歴を要約する機能を提供
 */
export const ChatSummaryButton: React.FC<ChatSummaryButtonProps> = ({
  onSummarize,
  disabled = false,
  isLoading = false,
  messageCount,
  language,
  className = "",
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();
  const handleClick = async () => {
    if (disabled || isLoading || messageCount === 0) return;

    try {
      await onSummarize();
      setIsSuccess(true);

      // 成功表示を2秒後にリセット
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("要約エラー:", error);
      setIsSuccess(false);
    }
  };

  const buttonDisabled = disabled || isLoading || messageCount === 0;

  const getButtonText = () => {
    if (messageCount === 0) return t("noSummaryTarget");
    if (isLoading) return t("summarizing");
    if (isSuccess) return t("summaryCompleted");
    return t("saveSummary") + `（${messageCount}）`;
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isSuccess) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className={`flex flex-col items-center space-y-1 ${className}`}>
      <button
        onClick={handleClick}
        disabled={buttonDisabled}
        className={`
          inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            buttonDisabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isSuccess
              ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 focus:ring-green-500"
              : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 focus:ring-green-500"
          }
        `}
        title={
          messageCount === 0
            ? "要約するチャットメッセージがありません"
            : isLoading
            ? "チャット履歴を要約中です..."
            : `${messageCount}件のメッセージを要約します`
        }
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </button>
    </div>
  );
};
