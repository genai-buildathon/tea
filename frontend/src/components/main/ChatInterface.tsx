"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot } from "lucide-react";
import { ChatMessage } from "@/contexts/AdkContext";
import { PhotoMessage } from "@/components/chat/PhotoMessage";
import { ChatSummaryButton } from "@/components/chat/ChatSummaryButton";
import { ChatSummaryDisplay } from "@/components/chat/ChatSummaryDisplay";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  onPhotoCapture?: () => Promise<void>;
  onSummarizeChat?: () => Promise<string>;
  isLoading?: boolean;
  isUploading?: boolean;
  canCapture?: boolean;
  isSummarizing?: boolean;
  userId?: string;
  sessionId?: string;
  onSummarySaved?: (summaryId: string) => void;
  frameImage?: string | null;
}

/**
 * チャットインターフェースコンポーネント
 * ユーザーとアシスタントの会話を表示し、新しいメッセージの送信を処理
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatHistory,
  onSendMessage,
  onPhotoCapture,
  onSummarizeChat,
  isLoading = false,
  isUploading = false,
  canCapture = false,
  isSummarizing = false,
  userId,
  sessionId,
  onSummarySaved,
  frameImage,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  // 要約関連の状態
  const [showSummary, setShowSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState("");

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");
      inputRef.current?.focus();
    }
  };

  // チャット要約ハンドラー
  const handleSummarizeChat = async () => {
    if (!onSummarizeChat || chatHistory.length === 0) return;

    try {
      const summary = await onSummarizeChat();
      if (summary) {
        setSummaryResult(summary);
        setShowSummary(true);
      }
    } catch (error) {
      console.error(t("summaryError"), error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* チャット要約表示 */}
      <ChatSummaryDisplay
        isVisible={showSummary}
        summary={summaryResult}
        onClose={() => setShowSummary(false)}
        messageCount={chatHistory.length}
        userId={userId}
        sessionId={sessionId}
        onSave={onSummarySaved}
        frameImage={frameImage}
      />

      {/* チャット履歴 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-60">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>{t("askQuestion")}</p>
          </div>
        ) : (
          chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.type === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                {/* アバター */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === "user"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* メッセージバブル */}
                {message.photoUrl ? (
                  <PhotoMessage
                    photoUrl={message.photoUrl}
                    caption={message.content}
                    timestamp={message.timestamp}
                    isUser={message.type === "user"}
                  />
                ) : (
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.type === "user"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.type === "user"
                          ? "text-emerald-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* メッセージ入力フォーム */}
      <div className="border-t border-gray-200 p-4">
        {/* 要約ボタン（チャット履歴がある場合のみ表示） */}
        {chatHistory.length > 0 && onSummarizeChat && (
          <div className="mb-3 flex justify-center">
            <ChatSummaryButton
              onSummarize={handleSummarizeChat}
              disabled={isSummarizing}
              isLoading={isSummarizing}
              messageCount={chatHistory.length}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t("inputPlaceholder")}
            disabled={isLoading || isUploading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || isUploading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
