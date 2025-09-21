"use client";
import React, { useState } from "react";
import {
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Database,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FrameImageDisplay } from "./FrameImageDisplay";

interface ChatSummaryDisplayProps {
  isVisible: boolean;
  summary: string;
  onClose: () => void;
  messageCount?: number;
  className?: string;
  sessionId?: string;
  userId?: string;
  onSave?: (summaryId: string) => void;
  frameImage?: string | null;
}

/**
 * チャット要約結果表示コンポーネント
 * 要約結果の表示、コピー、ダウンロード機能を提供
 */
export const ChatSummaryDisplay: React.FC<ChatSummaryDisplayProps> = ({
  isVisible,
  summary,
  onClose,
  messageCount = 0,
  className = "",
  sessionId,
  userId,
  onSave,
  frameImage,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { t } = useLanguage();
  if (!isVisible || !summary) return null;

  const handleSave = async () => {
    if (!userId || !sessionId || isSaving || isSaved) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const { saveChatSummary } = await import("@/services/summaryService");
      const summaryId = await saveChatSummary(userId, {
        sessionId,
        messageCount,
        rawSummary: summary,
        frameImageBase64: frameImage || undefined,
      });

      setIsSaved(true);
      onSave?.(summaryId);

      // 成功表示を3秒後にリセット
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error: any) {
      setSaveError(error.message || t("saveError"));
      console.error(t("saveError"), error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">
              {t("chatSummary")}
            </h3>
            {messageCount > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                {messageCount} {t("items")}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* 展開/折りたたみボタン */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-green-600 hover:bg-green-100 rounded-md transition-colors"
              title={isExpanded ? t("collapse") : t("expand")}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
              title={t("close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {saveError && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2 text-red-700 text-sm">
              <X className="w-4 h-4" />
              <span>{saveError}</span>
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* 成功表示 */}
        {isSaved && (
          <div className="px-4 py-2 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{t("summarySavedToFirebase")}</span>
            </div>
          </div>
        )}

        {/* コンテンツ */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 overflow-y-auto max-h-96 space-y-4">
              {/* フレーム画像表示 */}
              <FrameImageDisplay frameImage={frameImage || null} />

              {/* 要約テキスト */}
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {summary}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター - メイン保存ボタン */}
        {userId && sessionId && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                isSaved
                  ? "bg-green-600 hover:bg-green-700"
                  : isSaving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{t("saved")}</span>
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  <span>{t("saveLearning")}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
