"use client";
import React from "react";
import {
  X,
  Calendar,
  MessageSquare,
  Target,
  Wrench,
  MapPin,
  List,
  Tag,
} from "lucide-react";
import { ChatSummaryData } from "@/types/summary";
import { useLanguage } from "@/contexts/LanguageContext";
import { FrameImageDisplay } from "./FrameImageDisplay";

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
  const { t } = useLanguage();

  if (!isVisible || !summary) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleString(t("languageCode"), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-800">
                {t("summaryDetail")}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-green-600 mt-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(summary.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {summary.messageCount} {t("items")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
              title={t("close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* フレーム画像表示 */}
            <FrameImageDisplay
              frameImage={summary.frameImageUrl || null}
              imageType="url"
            />

            {/* 構造化データ */}
            {summary.structuredData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 目的/タスク */}
                {summary.structuredData.purpose && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <h3 className="font-medium text-blue-800">
                        {t("purpose")}
                      </h3>
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
                        {t("mainTools")}
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
                        {t("scene")}
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
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <h3 className="font-medium text-green-800">
                          {t("keywords")}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {summary.structuredData.keywords.map(
                          (keyword, index) => (
                            <span
                              key={index}
                              className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
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
                    <h3 className="font-medium text-gray-800">
                      {t("keyEvents")}
                    </h3>
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
              <h3 className="font-medium text-gray-800 mb-3">
                {t("fullSummary")}
              </h3>
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
