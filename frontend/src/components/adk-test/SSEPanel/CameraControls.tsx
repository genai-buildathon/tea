"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useCamera } from "@/hooks/useCamera";
import { useSSE } from "@/hooks/useSSE";

export const CameraControls: React.FC = () => {
  const { videoRef, connection, agent, sending, setSending, appendLog } =
    useAdkTest();

  const { camReady, startCamera, stopCamera, sendCurrentFrame } = useCamera();
  const { postJson } = useSSE() as any; // postJsonメソッドを取得

  const handleSendFrame = async () => {
    if (!connection || !camReady) return;
    setSending(true);
    try {
      const base64data = await sendCurrentFrame();
      if (base64data) {
        await fetch(`/api/sse/${agent}/${connection.connection_id}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: base64data }),
        });
        appendLog("SSE -> current webcam frame");
      }
    } catch (e: any) {
      appendLog("SSE webcam frame error: " + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* カメラ制御ボタン */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-800 min-w-[80px]">
          webcam
        </span>
        <button
          onClick={startCamera}
          disabled={camReady}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start Camera
        </button>
        <button
          onClick={stopCamera}
          disabled={!camReady}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Stop Camera
        </button>
        <button
          onClick={handleSendFrame}
          disabled={!camReady || !connection || sending}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? "送信中..." : "Send Frame"}
        </button>
      </div>

      {/* カメラプレビュー */}
      <div className="flex justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-80 h-60 bg-black rounded-lg border border-gray-300"
        />
      </div>
    </div>
  );
};
