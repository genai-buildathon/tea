"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type NavTab = "analyzer" | "history";

interface NavContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

interface NavProviderProps {
  children: ReactNode;
}

export const NavProvider: React.FC<NavProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>("analyzer");

  const value = {
    activeTab,
    setActiveTab,
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
};

export const useNav = (): NavContextType => {
  const context = useContext(NavContext);
  if (context === undefined) {
    throw new Error("useNav must be used within a NavProvider");
  }
  return context;
};
