"use client";
import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Database,
} from "lucide-react";

interface ChatSummaryDisplayProps {
  isVisible: boolean;
  summary: string;
  onClose: () => void;
  messageCount?: number;
  className?: string;
  sessionId?: string;
  userId?: string;
  onSave?: (summaryId: string) => void;
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
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isVisible || !summary) return null;

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `chat-summary-${timestamp}.txt`;

    const content = `チャット要約 (${messageCount}件のメッセージ)\n生成日時: ${new Date().toLocaleString(
      "ja-JP"
    )}\n\n${summary}`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

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
      });

      setIsSaved(true);
      onSave?.(summaryId);

      // 成功表示を3秒後にリセット
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error: any) {
      setSaveError(error.message || "保存に失敗しました");
      console.error("要約保存エラー:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">
              チャット要約
            </h3>
            {messageCount > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {messageCount}件
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* 展開/折りたたみボタン */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
              title={isExpanded ? "折りたたむ" : "展開する"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* 保存ボタン */}
            {userId && sessionId && (
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`p-1 rounded-md transition-colors ${
                  isSaved
                    ? "text-green-600 hover:bg-green-100"
                    : isSaving
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-purple-600 hover:bg-purple-100"
                }`}
                title={
                  isSaved
                    ? "保存済み"
                    : isSaving
                    ? "保存中..."
                    : "Firebaseに保存"
                }
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                ) : isSaved ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
              </button>
            )}

            {/* ダウンロードボタン */}
            <button
              onClick={handleDownload}
              className="p-1 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
              title="要約をダウンロード"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
              title="閉じる"
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
              <span>要約をFirebaseに保存しました</span>
            </div>
          </div>
        )}

        {/* コンテンツ */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-4 overflow-y-auto max-h-96">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {summary}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
