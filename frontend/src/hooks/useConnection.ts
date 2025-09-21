"use client";
import { useCallback, useEffect } from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import {
  findAvailableConnection,
  addConnectionToPool,
  updateConnectionActivity,
  deactivateConnection,
} from "@/services/connectionPoolService";

export const useConnection = () => {
  const {
    agent,
    userId,
    sessionId,
    connection,
    setConnection,
    creating,
    setCreating,
    appendLog,
    wsRef,
    esRef,
    setConnected,
    setSseConnected,
    setLastError,
    retryCount,
    setRetryCount,
    lastRetryTime,
    setLastRetryTime,
  } = useAdkTest();

  // レート制限チェック関数
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRetry = now - lastRetryTime;
    const minInterval = Math.min(1000 * Math.pow(2, retryCount), 30000); // 最大30秒

    if (retryCount >= 5) {
      appendLog(
        "❌ 最大再試行回数に達しました。しばらく待ってから手動で再試行してください。"
      );
      setLastError(
        "最大再試行回数に達しました。しばらく待ってから再試行してください。"
      );
      return false;
    }

    if (timeSinceLastRetry < minInterval) {
      const waitTime = Math.ceil((minInterval - timeSinceLastRetry) / 1000);
      appendLog(`⏳ レート制限のため ${waitTime} 秒待機してください`);
      setLastError(`レート制限のため ${waitTime} 秒待機してください`);
      return false;
    }

    return true;
  }, [retryCount, lastRetryTime, appendLog, setLastError]);

  const createConnection = useCallback(
    async (forceNew: boolean = false) => {
      // 必要な情報が揃っているかチェック
      if (!agent || !userId) {
        console.warn("Cannot create connection: missing agent or userId", {
          agent,
          userId,
        });
        appendLog(
          "接続作成エラー: ユーザー情報またはエージェント情報が不足しています"
        );
        return;
      }

      // 強制新規作成でない場合は、既存の接続を探す
      if (!forceNew) {
        const existingConnection = findAvailableConnection(
          agent,
          userId,
          sessionId
        );
        if (existingConnection) {
          appendLog(
            `🔄 既存の接続を再利用: ${existingConnection.connection_id} (session: ${existingConnection.session_id})`
          );
          setConnection({
            connection_id: existingConnection.connection_id,
            session_id: existingConnection.session_id,
          });
          updateConnectionActivity(existingConnection.connection_id);
          return;
        }
      }

      // レート制限チェック
      if (!checkRateLimit()) {
        return;
      }

      setCreating(true);
      try {
        // バックエンドAPIに接続作成リクエストを送信
        const res = await fetch(`/api/connections/${agent}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId || undefined, // 空の場合は新規セッション作成
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();

          // 429 Too Many Requests エラーの処理
          if (res.status === 429) {
            const errorMessage = "Too Many Requests: レート制限に達しました";
            appendLog("⚠️ レート制限に達しました。再試行間隔を延長します。");
            setLastError(errorMessage);
            setRetryCount(retryCount + 1);
            setLastRetryTime(Date.now());
            throw new Error(errorMessage);
          }

          // リソース制限エラーの場合は特別な処理
          if (
            errorText.includes("RESOURCE_EXHAUSTED") ||
            errorText.includes("Maximum concurrent sessions")
          ) {
            const errorMessage =
              "RESOURCE_EXHAUSTED: 最大同時セッション数を超えました";
            appendLog(
              "⚠️ 最大同時セッション数に達しています。既存の接続を切断してから再試行してください。"
            );
            setLastError(errorMessage);
            setRetryCount(retryCount + 1);
            setLastRetryTime(Date.now());
            // 既存の接続を強制切断
            if (wsRef.current) {
              wsRef.current.close(1000, "Force disconnect");
              wsRef.current = null;
              setConnected(false);
            }
            if (esRef.current) {
              esRef.current.close();
              esRef.current = null;
              setSseConnected(false);
            }
            setConnection(null);
            throw new Error(errorMessage);
          }

          throw new Error(`Failed: ${res.status} - ${errorText}`);
        }
        const data = await res.json();

        setConnection(data);
        // 接続プールに追加
        addConnectionToPool(data, agent, userId);
        appendLog(
          `✅ Connection created: ${data.connection_id} (session: ${data.session_id})`
        );
        // 成功時は再試行カウンターをリセット
        setRetryCount(0);
        setLastError(null);
      } catch (e: any) {
        console.error("Connection creation error:", e);
        appendLog(`❌ Error creating connection: ${e.message}`);
        setLastError(e.message);
      } finally {
        setCreating(false);
      }
    },
    [
      agent,
      userId,
      sessionId,
      setConnection,
      setCreating,
      appendLog,
      setLastError,
      setRetryCount,
      setLastRetryTime,
      checkRateLimit,
      wsRef,
      esRef,
      setConnected,
      setSseConnected,
      retryCount,
    ]
  );

  // 新しいセッションを強制作成する関数
  const createNewSession = useCallback(async () => {
    appendLog("🆕 新しいセッションを作成中...");
    await createConnection(true);
  }, [createConnection, appendLog]);

  // 特定のセッションに接続する関数
  const connectToSession = useCallback(
    async (targetSessionId: string) => {
      appendLog(`🎯 セッション ${targetSessionId} に接続中...`);

      const existingConnection = findAvailableConnection(
        agent,
        userId,
        targetSessionId
      );
      if (existingConnection) {
        setConnection({
          connection_id: existingConnection.connection_id,
          session_id: existingConnection.session_id,
        });
        updateConnectionActivity(existingConnection.connection_id);
        appendLog(`✅ セッション ${targetSessionId} に接続しました`);
      } else {
        appendLog(`❌ セッション ${targetSessionId} が見つかりません`);
      }
    },
    [agent, userId, setConnection, appendLog]
  );

  // 全ての接続を強制切断する関数
  const forceDisconnectAll = useCallback(async () => {
    appendLog("🔌 全ての接続を強制切断中...");

    // 現在の接続を非アクティブにする
    if (connection) {
      deactivateConnection(connection.connection_id);
    }

    // WebSocket接続を切断
    if (wsRef.current) {
      wsRef.current.close(1000, "Force disconnect");
      wsRef.current = null;
      setConnected(false);
      appendLog("WebSocket接続を切断しました");
    }

    // SSE接続を切断
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
      setSseConnected(false);
      appendLog("SSE接続を切断しました");
    }

    // 接続情報をクリア
    setConnection(null);
    appendLog("接続情報をクリアしました");
  }, [
    wsRef,
    esRef,
    setConnected,
    setSseConnected,
    setConnection,
    appendLog,
    connection,
  ]);

  // 適切な接続切断処理
  const disconnectConnection = useCallback(async () => {
    if (!connection) {
      appendLog("切断する接続がありません");
      return;
    }

    appendLog(`🔌 接続を切断中: ${connection.connection_id}`);
    await forceDisconnectAll();
  }, [connection, forceDisconnectAll, appendLog]);

  // ページ離脱時の自動切断処理
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (connection) {
        // 同期的に切断処理を実行
        if (wsRef.current) {
          wsRef.current.close(1000, "Page unload");
        }
        if (esRef.current) {
          esRef.current.close();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && connection) {
        // ページが非表示になった時の処理
        appendLog("ページが非表示になりました - 接続を維持します");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connection, wsRef, esRef, appendLog]);

  return {
    createConnection,
    createNewSession,
    connectToSession,
    disconnectConnection,
    forceDisconnectAll,
    creating,
  };
};
