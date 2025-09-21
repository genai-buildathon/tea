"use client";
import React, { useState } from "react";
import {
  X,
  Volume2,
  MessageCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { ChatInterface } from "../main/ChatInterface";
import Image from "next/image";

import { ChatMessage } from "@/contexts/AdkContext";

interface AnalysisOverlayProps {
  isVisible: boolean;
  text: string;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  onPhotoCapture?: () => Promise<void>;
  onSummarizeChat?: () => Promise<string>;
  isLoading?: boolean;
  isUploading?: boolean;
  isSummarizing?: boolean;
  canCapture?: boolean;
  sentFrameImage?: string | null;
  userId?: string;
  sessionId?: string;
  onSummarySaved?: (summaryId: string) => void;
}

/**
 * 画像解析結果を表示するオーバーレイコンポーネント
 * カメラ画面の上に重ねて解説テキストを表示
 */
export const AnalysisOverlay: React.FC<AnalysisOverlayProps> = ({
  isVisible,
  text,
  onClose,
  chatHistory,
  onSendMessage,
  onPhotoCapture,
  onSummarizeChat,
  isLoading = false,
  isUploading = false,
  isSummarizing = false,
  canCapture = false,
  sentFrameImage,
  userId,
  sessionId,
  onSummarySaved,
}) => {
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  if (!isVisible || !text) return null;

  const handleSpeakText = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* オーバーレイ背景 */}
      <div
        className="fixed inset-0 bg-black/50 z-0 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* オーバーレイコンテンツ */}
      <div className="fixed left-5 right-5 bottom-0 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-50 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-green-900">
                設え・茶道具解説
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {/* 音声読み上げボタン */}
              <button
                onClick={handleSpeakText}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                title="音声で読み上げ"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              {/* 閉じるボタン */}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* 解析結果エリア */}
            <div className="flex-1 p-4 overflow-y-auto">
              {/* 送信した画像を表示 */}
              {sentFrameImage && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2"></h4>
                  <div className="relative">
                    <Image
                      src={`data:image/jpeg;base64,${sentFrameImage}`}
                      alt="解析対象画像"
                      width={400}
                      height={300}
                      className="w-full h-auto rounded-lg border border-gray-300 shadow-sm"
                      style={{ maxHeight: "300px", objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}

              {/* 解析結果テキスト */}
              <div className="prose prose-sm prose-gray max-w-none">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  🔍 解析結果
                </h4>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  {text.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* チャットエリア（アコーディオン式） */}
            <div className="border-t border-gray-200">
              {/* チャットヘッダー（常に表示） */}
              <button
                onClick={() => setIsChatExpanded(!isChatExpanded)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-medium text-gray-700">
                    質問・会話
                  </h4>
                  {chatHistory.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[16px] h-4 flex items-center justify-center">
                      {chatHistory.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">
                    {isChatExpanded ? "閉じる" : "開く"}
                  </span>
                  {isChatExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </button>

              {/* チャットコンテンツ（展開時のみ表示） */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isChatExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {/* チャットインターフェース */}
                <div className="h-80">
                  <ChatInterface
                    chatHistory={chatHistory}
                    onSendMessage={onSendMessage}
                    onPhotoCapture={onPhotoCapture}
                    onSummarizeChat={onSummarizeChat}
                    isLoading={isLoading}
                    isUploading={isUploading}
                    isSummarizing={isSummarizing}
                    canCapture={canCapture}
                    userId={userId}
                    sessionId={sessionId}
                    onSummarySaved={onSummarySaved}
                    frameImage={sentFrameImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
