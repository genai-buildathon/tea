"use client";
import React from "react";
import Image from "next/image";

interface TearoomBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const TearoomBackground: React.FC<TearoomBackgroundProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Tearoom背景画像 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Tearoom.png"
          alt="Traditional Japanese Tearoom"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>
      {/* オーバーレイで少し暗くして、テキストを読みやすくする */}
      <div className="absolute inset-0 bg-white/50" />
      {/* コンテンツ */}

      <div className="relative z-10 h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
