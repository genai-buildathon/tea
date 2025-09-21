"use client";
import React, { useState } from "react";
import {
  X,
  Calendar,
  MessageSquare,
  Target,
  Wrench,
  MapPin,
  List,
  Tag,
  Download,
  Copy,
  CheckCircle,
} from "lucide-react";
import { ChatSummaryData } from "@/types/summary";

interface SummaryDetailModalProps {
  isVisible: boolean;
  summary: ChatSummaryData | null;
  onClose: () => void;
  className?: string;
}

/**
 * 要約詳細モーダルコンポーネント
 * 保存された要約の詳細情報を表示
 */
export const SummaryDetailModal: React.FC<SummaryDetailModalProps> = ({
  isVisible,
  summary,
  onClose,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  if (!isVisible || !summary) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary.rawSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("コピーに失敗しました:", error);
    }
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `summary-${summary.id}-${timestamp}.txt`;

    const content = `チャット要約詳細
ID: ${summary.id}
作成日時: ${formatDate(summary.createdAt)}
メッセージ数: ${summary.messageCount}件

${summary.rawSummary}`;

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

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-purple-800">
                要約詳細
              </h2>
              <div className="flex items-center space-x-4 text-sm text-purple-600 mt-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(summary.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{summary.messageCount}件</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
              title="要約をコピー"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* ダウンロードボタン */}
            <button
              onClick={handleDownload}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
              title="要約をダウンロード"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* 構造化データ */}
            {summary.structuredData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 目的/タスク */}
                {summary.structuredData.purpose && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <h3 className="font-medium text-blue-800">目的/タスク</h3>
                    </div>
                    <p className="text-blue-700 text-sm">
                      {summary.structuredData.purpose}
                    </p>
                  </div>
                )}

                {/* 主要な道具/対象 */}
                {summary.structuredData.mainTools && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wrench className="w-4 h-4 text-green-600" />
                      <h3 className="font-medium text-green-800">
                        主要な道具/対象
                      </h3>
                    </div>
                    <p className="text-green-700 text-sm">
                      {summary.structuredData.mainTools}
                    </p>
                  </div>
                )}

                {/* シーン/設定 */}
                {summary.structuredData.scene && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      <h3 className="font-medium text-orange-800">
                        シーン/設定
                      </h3>
                    </div>
                    <p className="text-orange-700 text-sm">
                      {summary.structuredData.scene}
                    </p>
                  </div>
                )}

                {/* 重要キーワード */}
                {summary.structuredData.keywords &&
                  summary.structuredData.keywords.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Tag className="w-4 h-4 text-purple-600" />
                        <h3 className="font-medium text-purple-800">
                          重要キーワード
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {summary.structuredData.keywords.map(
                          (keyword, index) => (
                            <span
                              key={index}
                              className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                            >
                              {keyword}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* キーイベント */}
            {summary.structuredData?.keyEvents &&
              summary.structuredData.keyEvents.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <List className="w-4 h-4 text-gray-600" />
                    <h3 className="font-medium text-gray-800">キーイベント</h3>
                  </div>
                  <ol className="space-y-2">
                    {summary.structuredData.keyEvents.map((event, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-600 text-xs rounded-full flex items-center justify-center font-medium">
                          {event.order}
                        </span>
                        <span className="text-gray-700 text-sm">
                          {event.description}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

            {/* 生の要約テキスト */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3">完全な要約</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {summary.rawSummary}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
