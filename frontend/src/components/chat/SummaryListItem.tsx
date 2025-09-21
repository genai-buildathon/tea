"use client";
import React from "react";
import {
  Calendar,
  MessageSquare,
  Tag,
  ChevronRight,
  Eye,
  Trash2,
} from "lucide-react";
import { SummaryListItem as SummaryListItemType } from "@/types/summary";
import { Language, useLanguage } from "@/contexts/LanguageContext";

interface SummaryListItemProps {
  summary: SummaryListItemType;
  onView: (summaryId: string) => void;
  onDelete?: (summaryId: string) => void;
  className?: string;
}

/**
 * 要約リストアイテムコンポーネント
 * 要約の概要情報を表示し、詳細表示・削除機能を提供
 */
export const SummaryListItem: React.FC<SummaryListItemProps> = ({
  summary,
  onView,
  onDelete,
  className = "",
}) => {
  const { t } = useLanguage();
  const formatDate = (date: Date, language: string) => {
    return date.toLocaleDateString(language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleView = () => {
    onView(summary.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm(t("deleteSummary"))) {
      onDelete(summary.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onClick={handleView}
    >
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(summary.createdAt, t("language"))}</span>
            <MessageSquare className="w-4 h-4 ml-2" />
            <span>
              {summary.messageCount} {t("items")}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleView}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title={t("viewSummary")}
            >
              <Eye className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title={t("deleteSummary")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* 目的/タスク */}
        {summary.purposeShort && (
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
              {summary.purposeShort}
            </h3>
          </div>
        )}

        {/* キーワード */}
        {summary.topKeywords && summary.topKeywords.length > 0 && (
          <div className="flex items-center space-x-1">
            <Tag className="w-3 h-3 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {summary.topKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
