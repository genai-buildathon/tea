"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  RefreshCw,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { SummaryListItem } from "./SummaryListItem";
import { SummaryDetailModal } from "./SummaryDetailModal";
import {
  SummaryListItem as SummaryListItemType,
  ChatSummaryData,
} from "@/types/summary";
import {
  getUserSummaries,
  getSummaryById,
  deleteSummary,
} from "@/services/summaryService";
import { useLanguage } from "@/contexts/LanguageContext";

interface SummaryListProps {
  userId: string;
  className?: string;
}

/**
 * 要約一覧コンポーネント
 * ユーザーの保存済み要約を一覧表示し、詳細表示・削除機能を提供
 */
export const SummaryList: React.FC<SummaryListProps> = ({
  userId,
  className = "",
}) => {
  const { t } = useLanguage();
  const [summaries, setSummaries] = useState<SummaryListItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSummary, setSelectedSummary] =
    useState<ChatSummaryData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 要約一覧を取得
  const fetchSummaries = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getUserSummaries(userId, 50);
      setSummaries(data);
    } catch (err: any) {
      setError(err.message || t("summaryListError"));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  // 初回読み込み
  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // 要約詳細を表示
  const handleViewSummary = async (summaryId: string) => {
    try {
      const summary = await getSummaryById(summaryId);
      if (summary) {
        setSelectedSummary(summary);
        setShowDetailModal(true);
      }
    } catch (err: any) {
      setError(err.message || t("summaryError"));
    }
  };

  // 要約を削除
  const handleDeleteSummary = async (summaryId: string) => {
    try {
      await deleteSummary(summaryId);
      setSummaries((prev) => prev.filter((s) => s.id !== summaryId));
    } catch (err: any) {
      setError(err.message || t("summaryDeleteError"));
    }
  };

  // 検索フィルタリング
  const filteredSummaries = summaries.filter((summary) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      summary.purposeShort?.toLowerCase().includes(searchLower) ||
      summary.topKeywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchLower)
      )
    );
  });

  if (!userId) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">{t("loginRequired")}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full space-y-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("learningHistory")}
          </h2>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            {summaries.length} {t("items")}
          </span>
        </div>
        <button
          onClick={fetchSummaries}
          disabled={loading}
          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
          title={t("update")}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 検索バー */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t("searchLearningContent")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              s{t("close")}
            </button>
          </div>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">{t("loading")}</span>
        </div>
      )}

      {/* 要約一覧 */}
      {!loading && (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3 pb-4">
            {filteredSummaries.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">
                  {searchTerm ? t("noSearchResults") : t("noLearningHistory")}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {t("saveChatLearning")}
                </p>
              </div>
            ) : (
              filteredSummaries.map((summary) => (
                <SummaryListItem
                  key={summary.id}
                  summary={summary}
                  onView={handleViewSummary}
                  onDelete={handleDeleteSummary}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      <SummaryDetailModal
        isVisible={showDetailModal}
        summary={selectedSummary}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSummary(null);
        }}
      />
    </div>
  );
};
