"use client";
import { useCallback } from "react";
import { useAdkTest, ChatMessage } from "@/contexts/AdkContext";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

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
        appendLog(t("noSummaryHistory"));
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
                ? t("user")
                : message.type === "assistant"
                ? t("assistant")
                : "システム";
            const content = message.photoUrl
              ? `[${t("photo")}] ${message.content}`
              : message.content;
            return `[${timestamp}] ${speaker}: ${content}`;
          })
          .join("\n");

        // メタデータAPIを使用してチャット要約を生成
        const summaryHint = `${t("summarizeChatHistory")}\n\n${t(
          "chatHistory"
        )}:\n${chatText}`;

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
          t("chatSummaryGenerated") + ` (${chatHistory.length}件のメッセージ)`
        );

        return summary;
      } catch (e: any) {
        const errorMessage = t("chatSummaryError") + ": " + e.message;
        setMetadataResult(errorMessage);
        appendLog(errorMessage);
        throw e;
      } finally {
        setMetadataLoading(false);
      }
    },
    [connection, appendLog, setMetadataResult, setMetadataLoading, t]
  );

  return {
    generateMetadata,
    summarizeChat,
    metadataLoading,
    metadataResult,
  };
};
