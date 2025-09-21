"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { WebSocketPanel } from "./WebSocketPanel";
import { SSEPanel } from "./SSEPanel";

export const CommunicationTabs: React.FC = () => {
  const { activeTab, setActiveTab, agent, connection } = useAdkTest();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        2. 送受信テスト
      </h2>

      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("ws")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "ws"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            WebSocket
          </button>
          <button
            onClick={() => setActiveTab("sse")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "sse"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            SSE
          </button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "ws" ? <WebSocketPanel /> : <SSEPanel />}
      </div>
    </div>
  );
};
