"use client";

import { createContext, useContext, useState } from "react";

type ChatContextType = {
  newChat: () => void;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const newChat = () => {
    localStorage.removeItem("sessionId");
    window.dispatchEvent(new Event("new-chat"));
  };

  return (
    <ChatContext.Provider value={{ newChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return ctx;
}
