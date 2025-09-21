"use client";
import React, { useState } from "react";
import { Download, ExternalLink, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

interface PhotoMessageProps {
  photoUrl: string;
  caption?: string;
  timestamp: Date;
  isUser?: boolean;
  onDownload?: () => void;
  className?: string;
}

/**
 * チャット内の写真メッセージコンポーネント
 * 写真の表示、プレビュー、ダウンロード機能を提供
 */
export const PhotoMessage: React.FC<PhotoMessageProps> = ({
  photoUrl,
  caption,
  timestamp,
  isUser = false,
  className = "",
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleImageClick = () => {
    setShowFullSize(!showFullSize);
  };

  if (imageError) {
    return (
      <div
        className={`
          rounded-lg p-4 max-w-xs
          ${
            isUser
              ? "bg-blue-500 text-white ml-auto"
              : "bg-gray-100 text-gray-800"
          }
          ${className}
        `}
      >
        <div className="flex items-center space-x-2 text-sm">
          <ExternalLink className="w-4 h-4" />
          <span>画像を読み込めませんでした</span>
        </div>
        {caption && <p className="text-sm mt-2 leading-relaxed">{caption}</p>}
        <p
          className={`text-xs mt-1 ${
            isUser ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {formatTime(timestamp)}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`
          rounded-lg overflow-hidden max-w-xs
          ${
            isUser
              ? "bg-blue-500 text-white ml-auto"
              : "bg-gray-100 text-gray-800"
          }
          ${className}
        `}
      >
        {/* 画像部分 */}
        <div className="relative">
          <div
            className={`
              relative w-full h-48 bg-gray-200 cursor-pointer
              ${!imageLoaded ? "animate-pulse" : ""}
            `}
            onClick={handleImageClick}
          >
            <Image
              src={photoUrl}
              alt="アップロードされた写真"
              fill
              className="object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />

            {/* オーバーレイボタン */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* キャプション・タイムスタンプ */}
        {(caption || timestamp) && (
          <div className="p-3">
            {caption && (
              <p className="text-sm leading-relaxed mb-1">{caption}</p>
            )}
            <p
              className={`text-xs ${
                isUser ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {formatTime(timestamp)}
            </p>
          </div>
        )}
      </div>

      {/* フルサイズ表示モーダル */}
      {showFullSize && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullSize(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowFullSize(false)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 z-10"
              title="閉じる"
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <Image
              src={photoUrl}
              alt="アップロードされた写真（フルサイズ）"
              width={800}
              height={600}
              className="object-contain max-w-full max-h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};
