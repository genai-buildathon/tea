"use client";
import React from "react";
import { AdkProvider } from "@/contexts/AdkContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CameraDisplay } from "./CameraDisplay";

/**
 * ADK機能を統合したカメラセクション
 * 毎回新規セッションを作成してカメラ機能を提供
 */
export const CameraSection: React.FC = () => {
  return (
    <AuthProvider>
      <AdkProvider>
        <div className="flex flex-col items-center justify-center space-y-6 p-8">
          <div className="w-full max-w-2xl">
            {/* 統合されたカメラ表示・制御・接続管理 */}
            <CameraDisplay />
          </div>
        </div>
      </AdkProvider>
    </AuthProvider>
  );
};
