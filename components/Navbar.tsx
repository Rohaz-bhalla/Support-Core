/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { ModeToggle } from "./ModeToggle";
import {
  PlusIcon,
  Download,
  Menu,
  X,
} from "lucide-react";
import { useChat } from "@/components/chat-context";
import { SiGithub, SiLinkedin, SiX } from "react-icons/si";

export function Navbar() {
  const { newChat } = useChat();

  /* PWA install */
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  /* Mobile menu */
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;

    setInstallPrompt(null);
    setIsInstallable(false);
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">

        {/* LEFT */}
        <div className="flex items-center gap-2">
          {/* Desktop: New Chat */}
          <button
            onClick={newChat}
            className="hidden md:flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </button>

          {/* Mobile: Icon only */}
          <button
            onClick={newChat}
            className="md:hidden rounded-md border p-2 hover:bg-muted"
            aria-label="New Chat"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* CENTER */}
        <h1 className="text-base md:text-lg font-semibold tracking-tight">
          Support-Core
        </h1>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* Mobile: Theme toggle always visible */}
          <div className="md:hidden">
            <ModeToggle />
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-4">
            {isInstallable && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Install
              </button>
            )}

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

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden rounded-md border p-2 hover:bg-muted"
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 z-50 h-full w-64 bg-background border-l p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Menu</h2>
              <button onClick={() => setMenuOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {isInstallable && (
              <button
                onClick={handleInstall}
                className="w-full flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            )}

            <a
              href="https://github.com/Rohaz-bhalla"
              target="_blank"
              rel="noreferrer"
              className="block hover:underline"
            >
              GitHub
            </a>

            <a
              href="https://www.linkedin.com/in/rohaz-bhalla"
              target="_blank"
              rel="noreferrer"
              className="block hover:underline"
            >
              LinkedIn
            </a>

            <a
              href="https://x.com/RohazBhalla"
              target="_blank"
              rel="noreferrer"
              className="block hover:underline"
            >
              X (Twitter)
            </a>
          </div>
        </>
      )}
    </header>
  );
}
