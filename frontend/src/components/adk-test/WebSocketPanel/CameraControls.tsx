"use client";
import React from "react";
import { useAdkTest } from "@/contexts/AdkContext";
import { useCamera } from "@/hooks/useCamera";

export const CameraControls: React.FC = () => {
  const { videoRef, fps, setFps, quality, setQuality, connected } =
    useAdkTest();

  const {
    camReady,
    streaming,
    startCamera,
    stopCamera,
    startCameraStreaming,
    stopCameraStreaming,
  } = useCamera();

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
      </div>

      {/* カメラプレビューと設定 */}
      <div className="flex items-start space-x-6">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-80 h-60 bg-black rounded-lg border border-gray-300"
        />

        <div className="flex flex-col space-y-4">
          {/* FPS設定 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-800 min-w-[60px]">
              fps
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value) || 1)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* JPEG品質設定 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-800 min-w-[60px]">
              jpeg q
            </label>
            <input
              type="number"
              step={0.05}
              min={0.1}
              max={0.95}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value) || 0.6)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ストリーミング制御 */}
          <div className="flex space-x-2">
            <button
              onClick={startCameraStreaming}
              disabled={!camReady || streaming || !connected}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start Stream
            </button>
            <button
              onClick={stopCameraStreaming}
              disabled={!streaming}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Stop Stream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
