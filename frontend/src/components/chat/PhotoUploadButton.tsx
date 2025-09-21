"use client";
import React, { useState } from "react";
import { Upload, Loader2 } from "lucide-react";

interface PhotoUploadButtonProps {
  onPhotoCapture: () => Promise<void>;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

/**
 * 写真キャプチャ・アップロードボタンコンポーネント
 * カメラからフレームをキャプチャしてアップロードする機能を提供
 */
export const PhotoUploadButton: React.FC<PhotoUploadButtonProps> = ({
  onPhotoCapture,
  disabled = false,
  isUploading = false,
  className = "",
}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleClick = async () => {
    if (disabled || isUploading || isCapturing) return;

    setIsCapturing(true);
    try {
      await onPhotoCapture();
    } catch (error) {
      console.error("写真キャプチャエラー:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const isLoading = isUploading || isCapturing;
  const buttonDisabled = disabled || isLoading;

  return (
    <button
      onClick={handleClick}
      disabled={buttonDisabled}
      className={`
        inline-flex items-center justify-center
        p-2 rounded-md
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          buttonDisabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-500"
        }
        ${className}
      `}
      title={
        isCapturing
          ? "写真をキャプチャ中..."
          : isUploading
          ? "アップロード中..."
          : "カメラから写真をキャプチャ"
      }
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
    </button>
  );
};
