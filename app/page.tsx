"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpIcon,
  Loader2,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { ChatContext } from "@/components/chat-context";

type Message = {
  sender: "user" | "ai";
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ---------- LOAD SESSION ---------- */

  useEffect(() => {
    const storedSession = localStorage.getItem("sessionId");
    const storedSessions = localStorage.getItem("sessions");

    if (storedSession) setSessionId(storedSession);
    if (storedSessions) setSessions(JSON.parse(storedSessions));
  }, []);

  useEffect(() => {
    if (sessionId) localStorage.setItem("sessionId", sessionId);
  }, [sessionId]);

  /* ---------- LOAD CHAT HISTORY ---------- */

  useEffect(() => {
    async function loadHistory() {
      if (!sessionId) return;
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    }
    loadHistory();
  }, [sessionId]);

  /* ---------- AUTOSCROLL ---------- */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------- SEND MESSAGE ---------- */

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
      setSessionId(data.sessionId);

      setSessions((prev) => {
        if (prev.find((s) => s.id === data.sessionId)) return prev;
        const updated = [
          { id: data.sessionId, title: userMessage.slice(0, 30) + "..." },
          ...prev,
        ];
        localStorage.setItem("sessions", JSON.stringify(updated));
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  /* ---------- DELETE CHAT ---------- */

  async function deleteChat(id: string) {
    await fetch(`/api/chat?sessionId=${id}`, { method: "DELETE" });
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem("sessions", JSON.stringify(updated));

    if (sessionId === id) {
      setSessionId(null);
      setMessages([]);
      localStorage.removeItem("sessionId");
    }
  }

  /* ---------- UI ---------- */

  return (
    <ChatContext.Provider
      value={{
        newChat: () => {
          setMessages([]);
          setSessionId(null);
          localStorage.removeItem("sessionId");
        },
      }}
    >
      {/* ROOT: lock scrolling */}
      <div className="h-screen overflow-hidden pt-14 flex">
        {/* Hamburger */}
        <button
          className="md:hidden fixed top-16 left-4 z-50 bg-background p-1 rounded"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-background border-r
            transform transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:static md:translate-x-0 md:w-1/5
          `}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-50">
              <h2 className="font-semibold">Chat History</h2>
              <button
                className="md:hidden text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Sidebar List */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded px-2 py-1 hover:bg-muted ${
                      sessionId === s.id ? "bg-muted" : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSessionId(s.id);
                        setSidebarOpen(false);
                      }}
                      className="flex-1 text-left truncate"
                    >
                      {s.title}
                    </button>

                    <button
                      onClick={() => deleteChat(s.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 text-sm max-w-[80%]
                      ${
                        m.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-foreground"
                      }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input (PINNED) */}
          <div className="border-t bg-background p-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about shipping, returns, orders..."
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </main>
      </div>
    </ChatContext.Provider>
  );
}
