"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useWebSocket } from "@/hooks/useWebSocket";

export const ConnectionControls: React.FC = () => {
  const { connection } = useAdkTest();
  const { connected, connect, disconnect } = useWebSocket();

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={connect}
        disabled={!connection || connected}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Connect WS
      </button>
      <button
        onClick={disconnect}
        disabled={!connected}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Disconnect
      </button>
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            connected ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-sm text-gray-800">
          {connected ? "接続中" : "未接続"}
        </span>
      </div>
    </div>
  );
};
