"use client";
import React from "react";

interface NavTabItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const NavTabItem: React.FC<NavTabItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center justify-center py-2 px-4 transition-colors duration-200 ${
        isActive
          ? "text-green-600 bg-green-50"
          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
      }`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};
