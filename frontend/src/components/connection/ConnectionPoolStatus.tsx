"use client";
import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Clock,
  Zap,
  Database,
  Activity,
  AlertCircle,
} from "lucide-react";
import { getConnectionStats } from "@/services/connectionPoolService";

interface ConnectionPoolStatusProps {
  userId?: string;
  currentConnectionId?: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  lastActivity?: Date;
  className?: string;
}

/**
 * 接続プール状態表示コンポーネント
 * 現在の接続状態とプール統計を表示
 */
export const ConnectionPoolStatus: React.FC<ConnectionPoolStatusProps> = ({
  userId,
  currentConnectionId,
  isConnected = false,
  isConnecting = false,
  lastActivity,
  className = "",
}) => {
  const [stats, setStats] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (userId) {
      const connectionStats = getConnectionStats(userId);
      setStats(connectionStats);
    }
  }, [userId, currentConnectionId]);

  const getStatusColor = () => {
    if (isConnecting) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (isConnected) return "text-green-600 bg-green-50 border-green-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getStatusIcon = () => {
    if (isConnecting) return <Zap className="w-4 h-4 animate-pulse" />;
    if (isConnected) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isConnecting) return "接続中...";
    if (isConnected) return "接続済み";
    return "未接続";
  };

  const formatLastActivity = () => {
    if (!lastActivity) return "なし";

    const now = new Date();
    const diff = now.getTime() - lastActivity.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    if (seconds > 30) return `${seconds}秒前`;
    return "今";
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* メインステータス */}
      <div
        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${getStatusColor()}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          {currentConnectionId && (
            <span className="text-xs opacity-75">
              {currentConnectionId.slice(-6)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {stats && (
            <div className="flex items-center space-x-1 text-xs">
              <Database className="w-3 h-3" />
              <span>
                {stats.active}/{stats.total}
              </span>
            </div>
          )}
          <Activity
            className={`w-3 h-3 transition-transform ${
              showDetails ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* 詳細情報 */}
      {showDetails && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="space-y-2">
            {/* 接続情報 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">接続ID:</span>
                <span className="font-mono text-gray-800">
                  {currentConnectionId ? currentConnectionId.slice(-8) : "なし"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">最終活動:</span>
                <span className="text-gray-800">{formatLastActivity()}</span>
              </div>
            </div>

            {/* プール統計 */}
            {stats && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-1 mb-1">
                  <Database className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    接続プール
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">アクティブ:</span>
                    <span className="font-medium text-green-600">
                      {stats.active}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">総接続数:</span>
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

                {/* エージェント一覧 */}
                {stats.agents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex flex-wrap gap-1">
                      {stats.agents.map((agent: string) => (
                        <span
                          key={agent}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 警告表示 */}
            {stats && stats.total > 3 && (
              <div className="flex items-center space-x-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="w-3 h-3 text-yellow-600" />
                <span className="text-xs text-yellow-700">
                  接続数が多くなっています。不要な接続をクリアすることをお勧めします。
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
