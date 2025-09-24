"use client";
import { useCallback, useMemo, useEffect } from "react";
import { useAdk } from "@/contexts/AdkContext";
import { useLanguage } from "@/contexts/LanguageContext";

export const useSSE = () => {
  const {
    agent,
    connection,
    esRef,
    sseConnected,
    setSseConnected,
    text,
    mode,
    busy,
    setBusy,
    appendLog,
  } = useAdk();
  const { language, t } = useLanguage();

  // SSE接続パスを生成
  const ssePath = useMemo(() => {
    if (!connection) return "";
    return `/api/sse/${agent}/${connection.connection_id}`;
  }, [connection, agent]);

  // 言語設定に応じた初期メッセージを生成
  const getLanguageInitMessage = useCallback((lang: string) => {
    switch (lang) {
      case "ja":
        return "日本語で答えてください";
      case "en":
        return "Please answer in English";
      case "es":
        return "Por favor responde en español";
      default:
        return "日本語で答えてください";
    }
  }, []);

  // SSE接続を開始
  const openSse = useCallback(() => {
    if (!ssePath) return;
    if (esRef.current) esRef.current.close();

    appendLog(`🔗 SSE connecting: ${ssePath}`);
    const es = new EventSource(ssePath);
    esRef.current = es;

    es.onopen = () => {
      setSseConnected(true);
      appendLog("✅ SSE opened");
    };
    es.onmessage = (ev) => {
      appendLog(`📨 SSE <- ${ev.data}`);
    };
    es.addEventListener("ready", async () => {
      appendLog("🟢 SSE ready");

      // SSE接続が確立されたら、言語設定に応じた初期メッセージを送信
      if (connection) {
        try {
          const languageMessage = getLanguageInitMessage(language);
          await postJson(`/api/sse/${agent}/${connection.connection_id}/text`, {
            data: languageMessage,
            language: language,
          });
          appendLog(`🌐 ${t("languageSettingSent")}: ${languageMessage}`);
        } catch (e: any) {
          appendLog(`❌ ${t("languageSettingError")}: ${e.message}`);
        }
      }
    });
    es.addEventListener("ping", () => appendLog("🏓 SSE ping"));
    es.onerror = (error) => {
      console.error("SSE error:", error);
      appendLog("❌ SSE error occurred");

      // エラー発生時は接続状態をfalseに設定
      setSseConnected(false);

      // リソース制限エラーの可能性がある場合の処理
      if (es.readyState === EventSource.CLOSED) {
        appendLog(
          "⚠️ SSE接続が閉じられました。リソース制限の可能性があります。"
        );
      }
    };

    // 接続が予期せず閉じられた場合の処理
    es.addEventListener("error", (event) => {
      if (es.readyState === EventSource.CLOSED) {
        appendLog("🔌 SSE接続が予期せず閉じられました");
        setSseConnected(false);
      }
    });
  }, [
    ssePath,
    appendLog,
    esRef,
    setSseConnected,
    connection,
    agent,
    language,
    getLanguageInitMessage,
    t,
  ]);

  // SSE接続を閉じる
  const closeSse = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setSseConnected(false);
    appendLog("🔌 SSE closed");
  }, [appendLog, esRef, setSseConnected]);

  // HTTP POSTリクエストを送信するユーティリティ
  const postJson = useCallback(async (path: string, body: any) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
    return res.json().catch(() => ({}));
  }, []);

  // テキストメッセージを送信
  const sendText = useCallback(async () => {
    if (!connection) return;
    try {
      await postJson(`/api/sse/${agent}/${connection.connection_id}/text`, {
        data: text,
        language: language,
      });
      appendLog(`SSE -> text: ${text}`);
    } catch (e: any) {
      appendLog(`SSE text error: ${e.message}`);
    }
  }, [agent, connection, text, language, postJson, appendLog]);

  // モード設定を送信
  const setModeReq = useCallback(async () => {
    if (!connection) return;
    try {
      await postJson(`/api/sse/${agent}/${connection.connection_id}/mode`, {
        data: mode,
        language: language,
      });
      appendLog(`SSE -> mode: ${mode}`);
    } catch (e: any) {
      appendLog(`SSE mode error: ${e.message}`);
    }
  }, [agent, connection, mode, language, postJson, appendLog]);

  // 画像ファイルを送信
  const sendImage = useCallback(
    async (file: File) => {
      if (!connection || !file) return;
      setBusy(true);
      try {
        const b64 = await fileToBase64(file);
        const base64data = b64.replace(/^data:.*;base64,/, "");
        await postJson(`/api/sse/${agent}/${connection.connection_id}/video`, {
          data: base64data,
          language: language,
        });
        appendLog(
          `SSE -> video frame (${file.name}, ${Math.round(
            file.size / 1024
          )} KB)`
        );
      } catch (e: any) {
        appendLog(`SSE video error: ${e.message}`);
      } finally {
        setBusy(false);
      }
    },
    [agent, connection, language, postJson, appendLog, setBusy]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, [esRef]);

  return {
    ssePath,
    sseConnected,
    openSse,
    closeSse,
    sendText,
    setModeReq,
    sendImage,
    busy,
    postJson, // postJsonメソッドをエクスポート
  };
};

// ファイルをBase64に変換するユーティリティ関数
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
