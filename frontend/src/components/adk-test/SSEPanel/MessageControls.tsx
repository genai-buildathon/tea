"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useSSE } from "@/hooks/useSSE";

export const MessageControls: React.FC = () => {
  const { text, setText, mode, setMode, connection } = useAdkTest();

  const { sendText, setModeReq, sendImage, busy } = useSSE();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendImage(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* テキスト送信 */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-800 min-w-[80px]">
          text
        </span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={sendText}
          disabled={!connection}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>

      {/* モード設定 */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-800 min-w-[80px]">
          mode
        </span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <button
          onClick={setModeReq}
          disabled={!connection}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Set
        </button>
      </div>

      {/* 画像ファイル送信 */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-800 min-w-[80px]">
          video frame
        </span>
        <input
          type="file"
          accept="image/jpeg,image/jpg"
          onChange={handleFileChange}
          disabled={!connection || busy}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {busy && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-800">送信中...</span>
          </div>
        )}
      </div>
    </div>
  );
};
