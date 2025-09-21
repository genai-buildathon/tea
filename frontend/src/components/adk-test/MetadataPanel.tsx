"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useMetadata } from "@/hooks/useMetadata";

export const MetadataPanel: React.FC = () => {
  const { connection, hint, setHint, metadataResult } = useAdkTest();

  const { generateMetadata, metadataLoading } = useMetadata();

  if (!connection) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        3. メタデータ生成（summary agent）
      </h2>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-800 min-w-[100px]">
            session_id
          </span>
          <code className="text-sm bg-gray-200 px-2 py-1 rounded">
            {connection.session_id}
          </code>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-800 min-w-[100px]">
            hint (任意)
          </span>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="要約に加えるヒント"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={generateMetadata}
            disabled={metadataLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {metadataLoading ? "生成中..." : "Generate"}
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-800">metadata</span>
          <pre className="w-full h-40 p-3 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono overflow-auto whitespace-pre-wrap">
            {metadataResult || "メタデータがここに表示されます..."}
          </pre>
        </div>
      </div>
    </div>
  );
};
