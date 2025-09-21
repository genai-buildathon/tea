"use client";
import { useCallback } from "react";
import { useAdkTest, ChatMessage } from "@/contexts/AdkContext";

export const useMetadata = () => {
  const {
    connection,
    hint,
    metadataResult,
    setMetadataResult,
    metadataLoading,
    setMetadataLoading,
    appendLog,
  } = useAdkTest();

  // セッションメタデータを生成
  const generateMetadata = useCallback(async () => {
    if (!connection) return;

    setMetadataLoading(true);
    try {
      const res = await fetch(
        `/api/sessions/${connection.session_id}/metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hint ? { hint } : {}),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMetadataResult(data.metadata || JSON.stringify(data));
      appendLog("Metadata generated");
    } catch (e: any) {
      setMetadataResult("error: " + e.message);
      appendLog("Metadata error: " + e.message);
    } finally {
      setMetadataLoading(false);
    }
  }, [connection, hint, appendLog, setMetadataResult, setMetadataLoading]);

  // チャット履歴を要約する関数
  const summarizeChat = useCallback(
    async (chatHistory: ChatMessage[]) => {
      if (!connection || chatHistory.length === 0) {
        appendLog("要約対象のチャット履歴がありません");
        return;
      }

      setMetadataLoading(true);
      try {
        // チャット履歴をテキスト形式に変換
        const chatText = chatHistory
          .map((message) => {
            const timestamp = message.timestamp.toLocaleString("ja-JP");
            const speaker =
              message.type === "user"
                ? "ユーザー"
                : message.type === "assistant"
                ? "アシスタント"
                : "システム";
            const content = message.photoUrl
              ? `[写真] ${message.content}`
              : message.content;
            return `[${timestamp}] ${speaker}: ${content}`;
          })
          .join("\n");

        // メタデータAPIを使用してチャット要約を生成
        const summaryHint = `以下のチャット履歴を要約してください。主要なトピック、質問と回答、重要なポイントを含めて簡潔にまとめてください。\n\nチャット履歴:\n${chatText}`;

        const res = await fetch(
          `/api/sessions/${connection.session_id}/metadata`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hint: summaryHint }),
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const summary = data.metadata || JSON.stringify(data);

        setMetadataResult(summary);
        appendLog(
          `チャット要約を生成しました (${chatHistory.length}件のメッセージ)`
        );

        return summary;
      } catch (e: any) {
        const errorMessage = "チャット要約エラー: " + e.message;
        setMetadataResult(errorMessage);
        appendLog(errorMessage);
        throw e;
      } finally {
        setMetadataLoading(false);
      }
    },
    [connection, appendLog, setMetadataResult, setMetadataLoading]
  );

  return {
    generateMetadata,
    summarizeChat,
    metadataLoading,
    metadataResult,
  };
};
