import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { conversations, messages } from "../../lib/schema";
import { eq } from "drizzle-orm";
import { generateReply } from "../../lib/groq";
import { rateLimit } from "../../lib/rate-limit";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* ================= CORS (DYNAMIC) ================= */
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";

  const allowedOrigins = [
    "https://rohaz-dev.vercel.app",
  ];

  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : "https://rohaz-dev.vercel.app",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/* ================= OPTIONS ================= */
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}

/* ================= POST ================= */
export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);

  try {
    /* ---------- RATE LIMIT ---------- */
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      "127.0.0.1";

    const { allowed } = rateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { reply: "Too many requests. Please slow down." },
        { status: 429, headers: corsHeaders }
      );
    }
    /* -------------------------------- */

    const { message, sessionId, source } = (await req.json()) as {
      message?: string;
      sessionId?: string;
      source?: "portfolio" | "spur";
    };

    if (!message || !message.trim()) {
      return NextResponse.json(
        { reply: "Message cannot be empty." },
        { status: 400, headers: corsHeaders }
      );
    }

    let conversationId = sessionId;

    if (!conversationId) {
      const result = await db
        .insert(conversations)
        .values({})
        .returning({ id: conversations.id });

      conversationId = result[0].id;
    }

    await db.insert(messages).values({
      conversationId,
      sender: "user",
      text: message,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .limit(10);

    const formattedHistory: ChatMessage[] = history.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const reply = await generateReply(
      formattedHistory,
      message,
      source ?? "spur"
    );

    await db.insert(messages).values({
      conversationId,
      sender: "ai",
      text: reply,
    });

    return NextResponse.json(
      { reply, sessionId: conversationId },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return NextResponse.json(
      { reply: "Something went wrong." },
      { status: 500, headers: corsHeaders }
    );
  }
}

/* ================= GET ================= */
export async function GET(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { messages: [] },
      { headers: corsHeaders }
    );
  }

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, sessionId))
    .orderBy(messages.createdAt);

  return NextResponse.json(
    {
      messages: history.map((m) => ({
        sender: m.sender,
        text: m.text,
      })),
    },
    { headers: corsHeaders }
  );
}

/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { success: false },
      { headers: corsHeaders }
    );
  }

  await db
    .delete(conversations)
    .where(eq(conversations.id, sessionId));

  return NextResponse.json(
    { success: true },
    { headers: corsHeaders }
  );
}
