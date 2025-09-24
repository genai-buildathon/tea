"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const openChat = () => {
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const value: ChatContextType = {
    isOpen,
    toggleChat,
    openChat,
    closeChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
