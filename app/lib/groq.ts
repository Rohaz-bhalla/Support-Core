import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const SYSTEM_PROMPT = `
You are a helpful customer support agent.

Only answer questions related to the product:
- Shipping
- Orders
- Returns & refunds
- Support hours

Policies:
- Shipping: Worldwide, 5–10 business days
- Returns: 30-day return policy
- Support hours: Mon–Fri, 9 AM – 6 PM IST

If a question is unrelated, politely redirect.
`;

export async function generateReply(
  history: { role: "user" | "assistant"; content: string }[],
  message: string
) {
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ],
    max_tokens: 200,
    temperature: 0.2,
  });

  return res.choices[0].message.content ?? "Sorry, I couldn't answer that.";
}
