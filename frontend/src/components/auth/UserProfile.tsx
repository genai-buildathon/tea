"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutButton } from "./LogoutButton";

interface UserProfileProps {
  className?: string;
  showLogoutButton?: boolean;
  variant?: "horizontal" | "vertical";
}

export const UserProfile: React.FC<UserProfileProps> = ({
  className = "",
  showLogoutButton = true,
  variant = "horizontal",
}) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isVertical = variant === "vertical";

  return (
    <div
      className={`flex ${
        isVertical ? "flex-col items-center gap-3" : "items-center gap-4"
      } ${className}`}
    >
      <div
        className={`flex ${
          isVertical ? "flex-col items-center gap-2" : "items-center gap-3"
        }`}
      >
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName || "ユーザーアバター"}
            className={`${
              isVertical ? "w-16 h-16" : "w-10 h-10"
            } rounded-full border-2 border-gray-200`}
          />
        )}
        <div
          className={`flex flex-col ${
            isVertical ? "items-center text-center" : ""
          }`}
        >
          {user.displayName && (
            <span className="text-sm font-medium text-gray-900">
              {user.displayName}
            </span>
          )}
          {user.email && (
            <span className="text-xs text-gray-500">{user.email}</span>
          )}
        </div>
      </div>

      {showLogoutButton && (
        <div className={isVertical ? "w-full" : ""}>
          <LogoutButton variant="text" />
        </div>
      )}
    </div>
  );
};
