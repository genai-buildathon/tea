"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdk } from "@/contexts/AdkContext";

export const useCamera = () => {
  const {
    videoRef,
    canvasRef,
    streamRef,
    timerRef,
    camReady,
    setCamReady,
    streaming,
    setStreaming,
    fps,
    quality,
    wsRef,
    connected,
    appendLog,
  } = useAdk();

  // カメラの向き状態（front: フロントカメラ, back: バックカメラ）
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");

  // カメラを開始
  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: cameraFacing === "front" ? "user" : "environment",
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamReady(true);
      appendLog(
        `Camera ready (${
          cameraFacing === "front" ? "フロント" : "バック"
        }カメラ)`
      );
    } catch (e: any) {
      appendLog("Camera error: " + e.message);
    }
  }, [streamRef, videoRef, setCamReady, appendLog, cameraFacing]);

  // カメラを停止
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: any) => t.stop());
      streamRef.current = null;
    }
    setCamReady(false);
  }, [streamRef, setCamReady]);

  // フレームをキャプチャしてWebSocketに送信
  const captureAndSendFrame = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const video = videoRef.current;
    if (!video) return;

    const canvas =
      canvasRef.current ||
      (canvasRef.current = document.createElement("canvas"));
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL(
      "image/jpeg",
      Math.min(Math.max(quality, 0.1), 0.95)
    );
    const base64data = dataUrl.replace(/^data:.*;base64,/, "");
    const payload = {
      type: "video",
      data: base64data,
      mode: "webcam",
      timestamp: Date.now(),
    };
    wsRef.current.send(JSON.stringify(payload));
  }, [quality, wsRef, videoRef, canvasRef]);

  // カメラストリーミングを開始
  const startCameraStreaming = useCallback(async () => {
    if (!connected) {
      appendLog("Connect WS first");
      return;
    }
    if (!camReady) await startCamera();
    if (timerRef.current) return;

    const interval = Math.max(1, Math.round(1000 / Math.max(1, fps)));
    timerRef.current = setInterval(captureAndSendFrame, interval);
    setStreaming(true);
    appendLog(`Start webcam WS streaming @ ${fps} fps, q=${quality}`);
  }, [
    connected,
    camReady,
    startCamera,
    fps,
    quality,
    captureAndSendFrame,
    appendLog,
    timerRef,
    setStreaming,
  ]);

  // カメラストリーミングを停止
  const stopCameraStreaming = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStreaming(false);
    appendLog("Stop webcam WS streaming");
  }, [appendLog, timerRef, setStreaming]);

  // 現在のフレームを送信（SSE用）
  const sendCurrentFrame = useCallback(async () => {
    if (!camReady) return null;

    const video = videoRef.current;
    if (!video) return null;

    const canvas =
      canvasRef.current ||
      (canvasRef.current = document.createElement("canvas"));
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const base64data = dataUrl.replace(/^data:.*;base64,/, "");
    return base64data;
  }, [camReady, videoRef, canvasRef]);

  // カメラを切り替え（フロント ⇔ バック）
  const switchCamera = useCallback(async () => {
    const wasReady = camReady;

    // 現在のカメラを停止
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamReady(false);
    }

    // カメラの向きを切り替え
    const newFacing = cameraFacing === "front" ? "back" : "front";
    setCameraFacing(newFacing);

    appendLog(
      `カメラを${
        newFacing === "front" ? "フロント" : "バック"
      }カメラに切り替え中...`
    );

    // 少し待ってから新しいカメラを開始
    setTimeout(async () => {
      if (wasReady) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
              facingMode: newFacing === "front" ? "user" : "environment",
            },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }
          setCamReady(true);
          appendLog(
            `${
              newFacing === "front" ? "フロント" : "バック"
            }カメラに切り替え完了`
          );
        } catch (e: any) {
          appendLog("カメラ切り替えエラー: " + e.message);
          // エラーの場合は元の向きに戻す
          setCameraFacing(cameraFacing);
        }
      }
    }, 100);
  }, [camReady, cameraFacing, streamRef, videoRef, setCamReady, appendLog]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopCamera();
    };
  }, [stopCamera, timerRef]);

  return {
    camReady,
    streaming,
    cameraFacing,
    startCamera,
    stopCamera,
    switchCamera,
    startCameraStreaming,
    stopCameraStreaming,
    sendCurrentFrame,
  };
};
