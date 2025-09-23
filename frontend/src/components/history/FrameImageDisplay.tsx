"use client";
import React, { useState } from "react";
import { Image, ZoomIn, ZoomOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FrameImageDisplayProps {
  frameImage: string | null;
  className?: string;
  /** 画像がURLかbase64かを指定 */
  imageType?: "base64" | "url";
}

/**
 * フレーム画像表示コンポーネント
 * 送信されたフレーム画像の表示、拡大/縮小機能を提供
 */
export const FrameImageDisplay: React.FC<FrameImageDisplayProps> = ({
  frameImage,
  className = "",
  imageType = "base64",
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const { t } = useLanguage();

  if (!frameImage) return null;

  const imageUrl =
    imageType === "base64"
      ? `data:image/jpeg;base64,${frameImage}`
      : frameImage;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Image className="w-4 h-4 text-green-600" />
        <h4 className="text-sm font-medium text-green-800">
          {t("frameImage")}
        </h4>
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="p-1 text-green-600 hover:bg-green-100 rounded-md transition-colors"
          title={isZoomed ? t("zoomOut") : t("zoomIn")}
        >
          {isZoomed ? (
            <ZoomOut className="w-3 h-3" />
          ) : (
            <ZoomIn className="w-3 h-3" />
          )}
        </button>
      </div>

      <div className="relative">
        <img
          src={imageUrl}
          alt={t("sentFrame")}
          className={`rounded-lg border border-gray-200 transition-all duration-300 ${
            isZoomed
              ? "w-full max-w-none cursor-zoom-out"
              : "w-32 h-24 object-cover cursor-zoom-in"
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {!isZoomed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};
