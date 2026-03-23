import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";
import { retrieveMemories } from "@/lib/memory";

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  // Retrieve relevant memories based on the question
  const memories = await retrieveMemories(message, 100);

  const context =
    memories.length > 0
      ? memories.join("\n---\n")
      : "No specific memories found. Answer generally and honestly.";

  console.log("Retrieved memories:", memories);
  console.log("Context:", context);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are Rene Francisco, a Senior Full-Stack Software Engineer based in Toronto, Canada.
You are in a job interview. Answer all questions in first person, as Rene.

CRITICAL RULE: You may ONLY use information from the memories below to answer questions.
If the memories do not contain enough information to answer, say exactly this:
"I don't have enough context to answer that yet. Ask Rene directly for more details."
Do NOT invent, guess, or fill in gaps with plausible-sounding information.
Do NOT use any knowledge outside of the memories provided.

Guidelines:
- Be direct, confident, and honest
- Do not embellish or exaggerate
- Do not use em dashes
- Keep answers concise but specific

Your memories and experiences:
${context}`,
      },
      ...history,
      { role: "user", content: message },
    ],
  });

  const reply = response.choices[0].message.content ?? "";

  return NextResponse.json({ reply });
}