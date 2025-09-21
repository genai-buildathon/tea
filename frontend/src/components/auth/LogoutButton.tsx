"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOutIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "text";
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "",
  variant = "secondary",
}) => {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error(t("logoutError"), error);
      // エラーハンドリングをここに追加できます
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ボタンのスタイルを取得するUtility
   * @returns
   */
  const getButtonStyles = () => {
    const baseStyles = `
      flex items-center justify-center gap-2 px-4 py-2 
      rounded-lg font-medium transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2
    `;

    switch (variant) {
      case "primary":
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      case "secondary":
        return `${baseStyles} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500`;
      case "text":
        return `${baseStyles} text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500`;
      default:
        return `${baseStyles} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500`;
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${getButtonStyles()} ${className}`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <LogOutIcon className="w-4 h-4" />
      )}
      <span>{isLoading ? t("loggingOut") : t("logout")}</span>
    </button>
  );
};
