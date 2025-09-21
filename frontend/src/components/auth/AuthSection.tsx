"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { UserProfile } from "./UserProfile";

interface AuthSectionProps {
  className?: string;
}

export const AuthSection: React.FC<AuthSectionProps> = ({ className = "" }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {user ? (
        <UserProfile />
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ようこそ</h2>
          <p className="text-gray-600 mb-6">
            Googleアカウントでサインインしてください
          </p>
          <GoogleLoginButton />
        </div>
      )}
    </div>
  );
};
