"use client";
import { useCallback, useMemo, useEffect } from "react";
import { useAdkTest } from "@/contexts/AdkContext";

export const useWebSocket = () => {
  const {
    agent,
    connection,
    wsRef,
    connected,
    setConnected,
    text,
    mode,
    busy,
    setBusy,
    appendLog,
    backendBase,
  } = useAdkTest();

  // WebSocket接続URLを生成
  const wsUrl = useMemo(() => {
    if (!connection) return "";
    const base = backendBase.replace(/^http/, "ws");
    return `${base}/ws/${agent}/${connection.connection_id}`;
  }, [connection, agent, backendBase]);

  // WebSocket接続を開始
  const connect = useCallback(() => {
    if (!wsUrl) return;
    if (wsRef.current) wsRef.current.close();

    appendLog(`🔗 WS connecting: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      appendLog("✅ WS opened");
    };
    ws.onmessage = (ev) => {
      appendLog(
        `📨 WS <- ${typeof ev.data === "string" ? ev.data : "[binary]"}`
      );
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      appendLog("❌ WS error occurred");
      setConnected(false);
    };
    ws.onclose = (event) => {
      setConnected(false);

      // クローズコードに応じたメッセージ
      if (event.code === 1011) {
        appendLog("🔌 WS closed: リソース制限エラー (1011)");
      } else if (event.code === 1000) {
        appendLog("🔌 WS closed: 正常終了");
      } else {
        appendLog(
          `🔌 WS closed: code ${event.code}, reason: ${event.reason || "不明"}`
        );
      }
    };
  }, [wsUrl, appendLog, wsRef, setConnected]);

  // WebSocket接続を切断
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnect");
      wsRef.current = null;
    }
    setConnected(false);
    appendLog("🔌 WS disconnected by user");
  }, [wsRef, setConnected, appendLog]);

  // テキストメッセージを送信
  const sendText = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const payload = { type: "text", data: text };
    wsRef.current.send(JSON.stringify(payload));
    appendLog(`WS -> text: ${text}`);
  }, [text, appendLog, wsRef]);

  // モード設定を送信
  const sendMode = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const payload = { type: "mode", data: mode };
    wsRef.current.send(JSON.stringify(payload));
    appendLog(`WS -> mode: ${mode}`);
  }, [mode, appendLog, wsRef]);

  // 画像ファイルを送信
  const sendImage = useCallback(
    async (file: File) => {
      if (!file || !wsRef.current || wsRef.current.readyState !== 1) return;
      setBusy(true);
      try {
        const b64 = await fileToBase64(file);
        const base64data = b64.replace(/^data:.*;base64,/, "");
        const payload = { type: "video", data: base64data, mode: "upload" };
        wsRef.current.send(JSON.stringify(payload));
        appendLog(
          `WS -> video frame (${file.name}, ${Math.round(file.size / 1024)} KB)`
        );
      } finally {
        setBusy(false);
      }
    },
    [appendLog, setBusy, wsRef]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsRef]);

  return {
    wsUrl,
    connected,
    connect,
    disconnect,
    sendText,
    sendMode,
    sendImage,
    busy,
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
