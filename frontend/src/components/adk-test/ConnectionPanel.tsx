"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useConnection } from "@/hooks/useConnection";

export const ConnectionPanel: React.FC = () => {
  const {
    agent,
    setAgent,
    userId,
    setUserId,
    sessionId,
    setSessionId,
    connection,
  } = useAdkTest();

  const { createConnection, creating } = useConnection();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        1. 接続を作成
      </h2>

      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-800">agent_key</label>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="analyze">analyze</option>
            <option value="summary">summary</option>
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-800">user_id</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user id"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-800">
            session_id (optional)
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="existing session id"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={createConnection}
          disabled={creating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? "Creating..." : "Create Connection"}
        </button>

        {connection && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-800">
                  connection_id:
                </span>
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                  {connection.connection_id}
                </code>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-800">
                  session_id:
                </span>
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                  {connection.session_id}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
