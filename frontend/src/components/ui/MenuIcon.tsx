"use client";
import React from "react";
import { Menu, X } from "lucide-react";

interface MenuIconProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MenuIcon: React.FC<MenuIconProps> = ({
  isOpen,
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-8 h-8 flex justify-center items-center transition-all duration-300 ${className}`}
      aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
    >
      {isOpen ? (
        <X className="w-8 h-8 text-gray-900 transition-all duration-300" />
      ) : (
        <Menu className="w-8 h-8 text-gray-900 transition-all duration-300" />
      )}
    </button>
  );
};
