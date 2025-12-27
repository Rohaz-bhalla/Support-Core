"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpIcon, Loader2, Trash2 } from "lucide-react";
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

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ---------- LOAD SESSION & SIDEBAR ---------- */

  useEffect(() => {
    const storedSession = localStorage.getItem("sessionId");
    const storedSessions = localStorage.getItem("sessions");

    if (storedSession) setSessionId(storedSession);
    if (storedSessions) setSessions(JSON.parse(storedSessions));
  }, []);

  useEffect(() => {
    function handleNewChat() {
      setMessages([]);
      setSessionId(null);
    }

    window.addEventListener("new-chat", handleNewChat);
    return () => window.removeEventListener("new-chat", handleNewChat);
  }, []);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("sessionId", sessionId);
    }
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
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
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
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong." },
      ]);
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
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-1/5 border-r">
          <Card className="h-full rounded-none">
            <CardHeader>
              <br />
              <h2 className="font-semibold">Chat History</h2>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[85vh]">
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded px-2 py-1 hover:bg-muted ${
                        sessionId === s.id ? "bg-muted" : ""
                      }`}
                    >
                      <button
                        onClick={() => setSessionId(s.id)}
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
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className="w-3/4 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <h2 className="font-semibold">Support Chat</h2>
            </CardHeader>

            <CardContent className="space-y-4">
              <ScrollArea className="h-120 rounded border p-3">
                <div className="space-y-2">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`text-sm ${
                        m.sender === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <strong>
                        {m.sender === "user" ? "You" : "Support"}:
                      </strong>{" "}
                      {m.text}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </ChatContext.Provider>
  );
}
