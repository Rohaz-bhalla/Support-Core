"use client";

import { ModeToggle } from "./ModeToggle";
import { PlusIcon } from "lucide-react";
import { useChat } from "@/components/chat-context";
import {
  SiGithub,
  SiLinkedin,
  SiX,
} from "react-icons/si";

export function Navbar() {
  const { newChat } = useChat();

  return (
    <div className="fixed top-0 left-0 z-50 w-full border-b bg-background px-4 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        {/* LEFT: New Chat */}
        <button
          onClick={newChat}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </button>

        {/* CENTER: App Name */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-tight">
          Support-Core
        </h1>

        {/* RIGHT: Social + Theme */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Rohaz-bhalla"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="text-muted-foreground hover:text-foreground"
          >
            <SiGithub className="h-5 w-5" />
          </a>

          <a
            href="https://www.linkedin.com/in/rohaz-bhalla"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="text-muted-foreground hover:text-foreground"
          >
            <SiLinkedin className="h-5 w-5" />
          </a>

          <a
            href="https://x.com/RohazBhalla"
            target="_blank"
            rel="noreferrer"
            aria-label="X"
            className="text-muted-foreground hover:text-foreground"
          >
            <SiX className="h-5 w-5" />
          </a>

          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
