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

export async function POST(req: Request) {
  try {
    /* ---------- RATE LIMIT ---------- */
    const ip =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const { allowed } = rateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { reply: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }
    /* -------------------------------- */

    const { message, sessionId } = (await req.json()) as {
      message?: string;
      sessionId?: string;
    };

    if (!message || !message.trim()) {
      return NextResponse.json(
        { reply: "Message cannot be empty." },
        { status: 400 }
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

    const reply = await generateReply(formattedHistory, message);

    await db.insert(messages).values({
      conversationId,
      sender: "ai",
      text: reply,
    });

    return NextResponse.json({
      reply,
      sessionId: conversationId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { reply: "Something went wrong." },
      { status: 500 }
    );
  }
}

/* ================= GET: Load Chat History ================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ messages: [] });
  }

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, sessionId))
    .orderBy(messages.createdAt);

  return NextResponse.json({
    messages: history.map((m) => ({
      sender: m.sender,
      text: m.text,
    })),
  });
}

/* ================= DELETE: Delete Chat ================= */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ success: false });
  }

  await db
    .delete(conversations)
    .where(eq(conversations.id, sessionId));

  return NextResponse.json({ success: true });
}
