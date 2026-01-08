import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function generateReply(
  history: { role: "user" | "assistant"; content: string }[],
  message: string,
  source: "portfolio" | "spur",
) {
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [ 
      { 
        role: "system", 
        content: 
          source === "portfolio" 
            ? ` 
You are Rohaz Bhalla’s portfolio assistant. 
 
Rules: 
- Talk only about Rohaz Bhalla. 
- Answer questions about his skills, projects, experience. 
- If someone asks random things, redirect to his work. 
- Be short, friendly, and professional. 
- Encourage checking projects or downloading resume. 
` 
            : ` 
You are a helpful customer support agent. 
 
Only answer questions related to the product: 
- Shipping 
- Orders 
- Returns & refunds 
- Support hours 
` 
      }, 
      ...history,
      { role: "user", content: message },
    ],
    max_tokens: 200,
    temperature: 0.2,
  });

  return res.choices[0].message.content ?? "Sorry, I couldn't answer that.";
}
