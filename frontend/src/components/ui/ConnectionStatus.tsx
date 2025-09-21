"use client";
import React from "react";
// import { useAdkTest } from "@/contexts/AdkContext";
// import { useConnection } from "@/hooks/useConnection";
import { Wifi, Power } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * コネクション状態表示コンポーネント
 * 接続状態の可視化と手動切断機能を提供
 */
export const ConnectionStatus: React.FC = () => {
  // const { connection, sseConnected, connected: wsConnected } = useAdkTest();
  const { t } = useLanguage();
  // const { disconnectConnection } = useConnection();

  // 接続済み状態の表示設定
  const config = {
    icon: Wifi,
    text: t("connected"),
    bgColor: "bg-green-50/70",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
  };
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between">
      {/* 接続状態表示 */}
      <div className="flex items-center">
        <div
          className={`flex items-center space-x-2 px-2 py-1 rounded-md ${config.bgColor} ${config.borderColor} border`}
        >
          <StatusIcon className={`w-4 h-4 ${config.iconColor}`} />
          <span className={`text-xs font-medium ${config.textColor}`}>
            {config.text}
          </span>
        </div>
      </div>
    </div>
  );
};
