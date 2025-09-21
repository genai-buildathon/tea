"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAdkTest, ChatMessage } from "@/contexts/AdkContext";
import { useCamera } from "@/hooks/useCamera";
import { useConnection } from "@/hooks/useConnection";
import { useSSE } from "@/hooks/useSSE";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisOverlay } from "./AnalysisOverlay";
import { ErrorNotification } from "../ui/ErrorNotification";
import { Play, Square, Camera, MessageCircle, RefreshCw } from "lucide-react";
import { ConnectionStatus } from "../ui/ConnectionStatus";
import { uploadChatPhoto } from "@/services/photoUploadService";
import { useMetadata } from "@/hooks/useMetadata";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * カメラ表示・制御統合コンポーネント
 * 接続管理、カメラプレビュー、制御ボタンを一体化
 */
export const CameraDisplay: React.FC = () => {
  const {
    videoRef,
    camReady,
    connection,
    agent,
    sending,
    setSending,
    appendLog,
    setAgent,
    userId,
    setUserId,
    setSessionId,
    sseConnected,
    analysisText,
    setAnalysisText,
    showAnalysisOverlay,
    setShowAnalysisOverlay,
    sentFrameImage,
    setSentFrameImage,
    chatHistory,
    addChatMessage,
    esRef,
    setLastError,
    connected,
  } = useAdkTest();
  const { startCamera, stopCamera, sendCurrentFrame } = useCamera();
  const { t } = useLanguage();
  const {
    createConnection,
    createNewSession,
    connectToSession,
    creating,
    forceDisconnectAll,
  } = useConnection();
  const { openSse, closeSse } = useSSE();
  const { user } = useAuth();
  const { summarizeChat, metadataLoading } = useMetadata();

  // チャット関連の状態
  const [chatLoading, setChatLoading] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // 新規接続状態を追加
  const [isReconnecting, setIsReconnecting] = useState(false);

  // 一意なIDを生成する関数
  const generateUniqueId = useCallback(
    (prefix: string) => {
      const counter = messageCounter;
      setMessageCounter((prev) => prev + 1);
      return `${prefix}-${Date.now()}-${counter}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    },
    [messageCounter]
  );

  // 初期設定のuseEffect（一度だけ実行）
  useEffect(() => {
    setSessionId(""); // 新規セッション強制
    setAgent("analyze"); // 常にanalyzeエージェントを使用
  }, [setSessionId, setAgent]); // 必要な依存関数を追加

  // ユーザー認証状態に基づく接続管理
  useEffect(() => {
    if (user && user.uid) {
      setUserId(user.uid);
      // ユーザーIDが設定され、まだ接続がない場合のみ接続を作成
      if (userId === user.uid && !connection && !creating) {
        setTimeout(() => {
          createConnection();
        }, 500); // 少し遅延させて状態が安定してから実行
      }
    } else {
      setUserId(""); // ログアウト時はユーザーIDもクリア
    }
  }, [user, connection, creating, createConnection, setUserId, userId]);

  // 接続が確立されたらSSE接続を開始
  useEffect(() => {
    if (connection && !sseConnected) {
      openSse();
    }

    // クリーンアップ: コンポーネントがアンマウントされたらSSE接続を閉じる
    return () => {
      if (sseConnected) {
        closeSse();
      }
    };
  }, [connection, sseConnected, openSse, closeSse]);

  // SSE接続でのメッセージ処理を拡張
  useEffect(() => {
    if (!connection || !sseConnected || !esRef.current) return;

    const eventSource = esRef.current;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      appendLog(`SSE <- ${data}`);

      // 解析結果のテキストを検出して処理
      if (data && typeof data === "string" && data.length > 10) {
        // チャットローディング中の場合はチャット応答として処理
        if (chatLoading) {
          const assistantMessage: ChatMessage = {
            id: generateUniqueId("assistant"),
            type: "assistant",
            content: data,
            timestamp: new Date(),
          };
          addChatMessage(assistantMessage);
          setChatLoading(false);
        } else {
          // 通常の解析結果として処理
          setAnalysisText(data);
          setShowAnalysisOverlay(true);

          // 解析結果をチャット履歴にも追加
          const systemMessage: ChatMessage = {
            id: generateUniqueId("system"),
            type: "system",
            content: `画像解析結果: ${data}`,
            timestamp: new Date(),
          };
          addChatMessage(systemMessage);
        }
      }
    };

    // 既存のonmessageハンドラーを置き換え
    eventSource.onmessage = handleMessage;

    // クリーンアップ
    return () => {
      if (eventSource.onmessage === handleMessage) {
        eventSource.onmessage = null;
      }
    };
  }, [
    connection,
    sseConnected,
    esRef,
    appendLog,
    setAnalysisText,
    setShowAnalysisOverlay,
    chatLoading,
    addChatMessage,
    generateUniqueId,
  ]);

  // チャットメッセージ送信ハンドラー
  const handleSendChatMessage = async (message: string) => {
    if (!connection || !sseConnected) return;

    // ユーザーメッセージをチャット履歴に追加
    const userMessage: ChatMessage = {
      id: generateUniqueId("user"),
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    addChatMessage(userMessage);

    // ローディング状態を設定
    setChatLoading(true);

    try {
      // テキストメッセージをSSE経由で送信
      await fetch(`/api/sse/${agent}/${connection.connection_id}/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: message }),
      });
      appendLog(t("chatMessageSent"));
    } catch (e: any) {
      appendLog("チャットメッセージ送信エラー: " + e.message);
      setChatLoading(false);
    }
  };

  // 写真キャプチャ・アップロードハンドラー
  const handlePhotoCapture = async () => {
    if (!connection || !camReady || !sseConnected || !user) {
      appendLog(t("photoConditionsNotMet"));
      return;
    }

    setIsUploading(true);
    try {
      // カメラからフレームをキャプチャ
      const base64data = await sendCurrentFrame();
      if (!base64data) {
        throw new Error(t("frameCaptureError"));
      }

      // Firebase Storageにアップロード
      const { photoId, downloadURL } = await uploadChatPhoto(
        base64data,
        user.uid,
        generateUniqueId("photo"),
        connection.session_id,
        t("cameraPhoto")
      );

      // チャット履歴に写真メッセージを追加
      const photoMessage: ChatMessage = {
        id: generateUniqueId("user-photo"),
        type: "user",
        content: t("photoSent"),
        timestamp: new Date(),
        photoUrl: downloadURL,
        photoId: photoId,
      };
      addChatMessage(photoMessage);

      appendLog(`写真をアップロードしました: ${photoId}`);
    } catch (error: any) {
      appendLog(`写真アップロードエラー: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // チャット要約ハンドラー
  const handleSummarizeChat = async (): Promise<string> => {
    if (!connection || chatHistory.length === 0) {
      throw new Error(t("noSummaryHistory"));
    }

    try {
      const summary = await summarizeChat(chatHistory);
      return summary || "";
    } catch (error) {
      appendLog(`チャット要約エラー: ${error}`);
      throw error;
    }
  };

  const handleSendFrame = async () => {
    if (!connection || !camReady || !sseConnected) {
      if (!sseConnected) {
        appendLog(t("sseNotConnected"));
      }
      return;
    }
    setSending(true);

    try {
      const base64data = await sendCurrentFrame();
      if (base64data) {
        // 送信した画像データを保存
        setSentFrameImage(base64data);

        await fetch(`/api/sse/${agent}/${connection.connection_id}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: base64data }),
        });
        appendLog(t("frameSent"));
        console.log("フレームを送信しました!!!");
        setShowAnalysisOverlay(true);
      }
    } catch (e: any) {
      appendLog("フレーム送信エラー: " + e.message);
    } finally {
      setSending(false);
    }
  };

  // 新規接続ハンドラー
  const handleNewConnection = async () => {
    if (isReconnecting) return;

    setIsReconnecting(true);
    appendLog(t("startingNewConnection"));

    try {
      // 既存の接続を切断
      await forceDisconnectAll();

      // セッションIDをクリア（新規セッション強制）
      setSessionId("");

      // 少し待ってから新しい接続を作成
      setTimeout(() => {
        createConnection();
        appendLog(t("newConnectionCreated"));
      }, 1000);
    } catch (error: any) {
      appendLog(`新規接続エラー: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsReconnecting(false);
      }, 2000); // 2秒後にローディング状態を解除
    }
  };

  // ユーザーがログインしていない場合の表示
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-md border border-yellow-200">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-yellow-800">
              ⚠️ 認証が必要です
            </div>
            <div className="text-sm text-yellow-700">
              カメラ機能を使用するにはFirebaseでログインしてください
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 接続がない場合の表示
  if (!connection) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">{t("connecting")}...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー再試行ハンドラー
  const handleRetryConnection = async () => {
    setLastError(null);
    await forceDisconnectAll();
    setTimeout(() => {
      createConnection();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* 新規接続ボタン */}
      <div className="flex justify-center">
        <button
          onClick={handleNewConnection}
          disabled={isReconnecting || creating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          title={t("createNewConnection")}
        >
          <RefreshCw
            className={`w-4 h-4 ${
              isReconnecting || creating ? "animate-spin" : ""
            }`}
          />
          <span className="text-sm font-medium">
            {isReconnecting
              ? t("connecting")
              : creating
              ? t("creating")
              : t("createNewConnection")}
          </span>
        </button>
      </div>

      {/* カメラプレビュー */}
      <div className="flex justify-center">
        <div className="relative">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-80 h-80 bg-black rounded-md object-cover"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={camReady ? stopCamera : startCamera}
              className={`p-3 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-lg ${
                camReady
                  ? "bg-gray-700/90 hover:bg-gray-600/90 focus:ring-gray-500"
                  : "bg-gray-600/90 hover:bg-gray-500/90 focus:ring-gray-400"
              }`}
              title={camReady ? t("cameraStop") : t("cameraStart")}
            >
              {camReady ? (
                <Square className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleSendFrame}
              disabled={!camReady || sending || !sseConnected}
              className="p-3 bg-gray-600/90 text-white rounded-full hover:bg-gray-500/90 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
              title={
                sending
                  ? t("sending")
                  : !sseConnected
                  ? t("waitingSSE")
                  : t("sendFrame")
              }
            >
              <Camera className={`w-5 h-5 ${sending ? "animate-pulse" : ""}`} />
            </button>
          </div>

          <div className="absolute top-3 left-3">
            {/* 接続状態表示（接続済みの時のみ） */}
            {connection && (sseConnected || connected) && <ConnectionStatus />}
          </div>

          {/* カメラ状態インジケーター（右上） */}
          <div className="absolute top-3 right-3">
            <div
              onClick={() => setShowAnalysisOverlay(true)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                camReady
                  ? "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                  : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
              } transition-colors`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  camReady ? "bg-red-500" : "bg-gray-400"
                }`}
              />
              <span>{camReady ? "ON" : "OFF"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 解析結果オーバーレイ */}
      <AnalysisOverlay
        isVisible={showAnalysisOverlay}
        text={analysisText}
        onClose={() => setShowAnalysisOverlay(false)}
        chatHistory={chatHistory}
        onSendMessage={handleSendChatMessage}
        onPhotoCapture={handlePhotoCapture}
        onSummarizeChat={handleSummarizeChat}
        isLoading={chatLoading}
        isUploading={isUploading}
        isSummarizing={metadataLoading}
        canCapture={camReady && sseConnected && !!user}
        sentFrameImage={sentFrameImage}
        userId={user?.uid}
        sessionId={connection?.session_id}
        onSummarySaved={(summaryId) => {
          appendLog(`要約を保存しました: ${summaryId}`);
        }}
      />
    </div>
  );
};
