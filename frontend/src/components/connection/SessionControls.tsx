"use client";
import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Plus,
  Clock,
  Users,
  Database,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getUserSessions,
  getConnectionStats,
  clearUserConnections,
} from "@/services/connectionPoolService";

interface SessionControlsProps {
  userId: string;
  agent: string;
  currentSessionId?: string;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRefreshConnection: () => void;
  isConnecting?: boolean;
  className?: string;
}

/**
 * セッション制御コンポーネント
 * セッション一覧、新規作成、再利用機能を提供
 */
export const SessionControls: React.FC<SessionControlsProps> = ({
  userId,
  agent,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onRefreshConnection,
  isConnecting = false,
  className = "",
}) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // セッション一覧と統計を更新
  const refreshData = () => {
    if (!userId) return;

    const userSessions = getUserSessions(userId, agent);
    const connectionStats = getConnectionStats(userId);

    setSessions(userSessions);
    setStats(connectionStats);
  };

  useEffect(() => {
    refreshData();
  }, [userId, agent, currentSessionId]);

  const handleNewSession = () => {
    onNewSession();
    setTimeout(refreshData, 500); // 少し遅延させて新しいセッションを反映
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setTimeout(refreshData, 500);
  };

  const handleClearAllSessions = () => {
    if (window.confirm("全てのセッションをクリアしますか？")) {
      clearUserConnections(userId);
      refreshData();
      onNewSession(); // 新しいセッションを開始
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionAge = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return "今";
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-800">セッション管理</h3>
          {stats && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {stats.active}/{stats.total}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* 統計表示切り替え */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            title={showStats ? "統計を隠す" : "統計を表示"}
          >
            {showStats ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </button>

          {/* 展開/折りたたみ */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            title={isExpanded ? "折りたたむ" : "展開する"}
          >
            <Users
              className={`w-3 h-3 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      {showStats && stats && (
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">アクティブ:</span>
              <span className="font-medium">{stats.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">総数:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">エージェント:</span>
              <span className="font-medium">{stats.agents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">セッション:</span>
              <span className="font-medium">{stats.sessions.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* 制御ボタン */}
      <div className="p-3 space-y-2">
        <div className="flex space-x-2">
          {/* 新規セッション */}
          <button
            onClick={handleNewSession}
            disabled={isConnecting}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>新規セッション</span>
          </button>

          {/* 接続更新 */}
          <button
            onClick={onRefreshConnection}
            disabled={isConnecting}
            className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="接続を更新"
          >
            <RefreshCw
              className={`w-4 h-4 ${isConnecting ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* 全クリアボタン */}
        {sessions.length > 0 && (
          <button
            onClick={handleClearAllSessions}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>全セッションクリア</span>
          </button>
        )}
      </div>

      {/* セッション一覧 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                最近のセッション ({sessions.length})
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                保存されたセッションがありません
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={`p-2 rounded-md border cursor-pointer transition-colors ${
                      session.sessionId === currentSessionId
                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelectSession(session.sessionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">
                          {session.sessionId.slice(-8)}...
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(session.lastUsed)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {getSessionAge(session.lastUsed)}
                        </span>
                        <div className="flex space-x-1">
                          {session.agents.map((agentName: string) => (
                            <div
                              key={agentName}
                              className="w-2 h-2 bg-blue-400 rounded-full"
                              title={agentName}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
