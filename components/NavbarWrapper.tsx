"use client";

import { Navbar } from "@/components/Navbar";
import { useChat } from "@/components/chat-context";

export function NavbarWrapper() {
  const { newChat } = useChat();
  return <Navbar />;
}
