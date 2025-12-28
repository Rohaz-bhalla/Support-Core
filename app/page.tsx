/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Mic,
  MicOff,
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

  /* 🎤 Voice */
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef(false);

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

  /* ---------- NEW CHAT EVENT (FIXED) ---------- */

  useEffect(() => {
    function handleNewChat() {
      setMessages([]);
      setSessionId(null);
      setInput("");
      localStorage.removeItem("sessionId");
    }

    window.addEventListener("new-chat", handleNewChat);
    return () => window.removeEventListener("new-chat", handleNewChat);
  }, []);

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

  /* ---------- VOICE INIT ---------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const text = transcript.toLowerCase();

      if (text.includes("new chat")) {
        window.dispatchEvent(new Event("new-chat"));
        return;
      }

      if (text.includes("send message")) {
        sendMessage();
        return;
      }

      setInput(transcript);
    };

    recognition.onerror = () => {
      isRecognizingRef.current = false;
      setListening(false);
      recognition.abort();
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecognizingRef.current) {
      recognition.stop();
      return;
    }

    recognition.start();
  }

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
        newChat: () => window.dispatchEvent(new Event("new-chat")),
      }}
    >
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
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">Chat History</h2>
              <button
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <ScrollArea className="flex-1 p-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted"
                >
                  <button
                    className="flex-1 truncate text-left"
                    onClick={() => {
                      setSessionId(s.id);
                      setSidebarOpen(false);
                    }}
                  >
                    {s.title}
                  </button>
                  <button onClick={() => deleteChat(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </ScrollArea>
          </div>
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col">
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
                    className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-muted"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t bg-background p-4">
            <div className="flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about shipping, returns, orders..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <Button variant="outline" onClick={toggleListening}>
                {listening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              <Button onClick={sendMessage}>
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Helper text */}
            <p className="mt-2 text-xs text-muted-foreground">
              Voice input works best in Chromium-based browsers (Chrome, Edge).
            </p>
          </div>
        </main>
      </div>
    </ChatContext.Provider>
  );
}
