"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useSSE } from "@/hooks/useSSE";

export const ConnectionControls: React.FC = () => {
  const { connection } = useAdkTest();
  const { sseConnected, openSse, closeSse } = useSSE();

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={openSse}
        disabled={!connection || sseConnected}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Open SSE
      </button>
      <button
        onClick={closeSse}
        disabled={!sseConnected}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Close SSE
      </button>
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            sseConnected ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-sm text-gray-800">
          {sseConnected ? "接続中" : "未接続"}
        </span>
      </div>
    </div>
  );
};
