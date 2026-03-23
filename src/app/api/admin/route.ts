import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";
import { storeMemoriesSequentially, retrieveMemories } from "@/lib/memory";

interface MemoryChunk {
  content: string;
  category: string;
}

interface Classification {
  intent: string;
  memories: MemoryChunk[];
}

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();
  const adminPassword = req.headers.get("x-admin-password");
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const relatedMemories = await retrieveMemories(message, 3);

  const classificationResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a memory manager for a personal AI assistant representing Rene Francisco, a Senior Full-Stack Software Engineer.

Your job is to analyze what the user says and store it in a way that makes it highly retrievable during a job interview.

CHUNKING RULES:
- For STAR stories, behavioral answers, conflicts, achievements, or anything interview-relevant: store as ONE complete narrative chunk. Never break these into pieces.
- For work history: store each role as one chunk covering responsibilities, impact, and context.
- For tech stack: store per employer, tied to the company name and dates.
- For corrections or clarifications: store as a new chunk that supersedes the old one.
- For casual conversation with nothing to store: return empty memories array.

CHUNK FORMAT:
- Always write in third person ("Rene...")
- For resumes: extract EVERY role as its own chunk, EVERY tech stack as its own chunk per employer, AND any certifications, education, and summary as separate chunks. Do not skip any section.
- Always include company name and dates when relevant
- For behavioral stories, prefix with the interview question type it answers:
  "When asked about yourself, your background, or to introduce yourself: ..."
  "When asked about conflict, disagreement, or pushback: ..."
  "When asked about a technical challenge or difficult problem: ..."
  "When asked about leadership, mentorship, or managing others: ..."
  "When asked about a failure, mistake, or lesson learned: ..."
  "When asked about a time you influenced or convinced someone: ..."
  "When asked about your greatest achievement or proud moment: ..."
- Make chunks rich and complete -- include situation, action, and outcome
- A good chunk should match synonyms naturally. A conflict story should surface for: disagreement, pushback, conflict, convince someone, different opinion, collaboration challenge.

CRITICAL: You MUST start every behavioral or interview-relevant memory chunk with the appropriate prefix above.
Never store a chunk without a prefix. The prefix is what makes retrieval work.
A chunk without a prefix will fail to match interview questions.

Related memories already stored:
${relatedMemories.length > 0 ? relatedMemories.join("\n---\n") : "None"}

Classify the message as one of:
- NEW: Brand new information not yet stored
- CORRECTION: Fixes or updates something already stored
- CLARIFICATION: Adds nuance to something already stored
- CONVERSATION: Just chatting, nothing to store

Respond ONLY in this JSON format with no markdown or backticks:
{
  "intent": "NEW" | "CORRECTION" | "CLARIFICATION" | "CONVERSATION",
  "memories": [
    { "content": "rich, complete memory chunk", "category": "experience" | "technical" | "leadership" | "achievement" | "personality" | "correction" },
    { "content": "another chunk", "category": "..." }
  ]
}

If intent is CONVERSATION, return an empty memories array.`,
      },
      { role: "user", content: message },
    ],
  });

  const raw = classificationResponse.choices[0].message.content ?? "{}";
  let parsed: Classification;

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { intent: "CONVERSATION", memories: [] };
  }

  if (parsed.memories?.length && parsed.intent !== "CONVERSATION") {
    await storeMemoriesSequentially(parsed.memories);
  }

  const replyResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant managing Rene Francisco's personal AI interview assistant.
Rene is feeding you information about himself so you can answer interview questions on his behalf.
Acknowledge what he told you, confirm how many memory chunks you stored if anything, and let him know how it might help in interviews.
Be concise and conversational. No em dashes.`,
      },
      ...history,
      { role: "user", content: message },
    ],
  });

  const reply = replyResponse.choices[0].message.content ?? "";

  return NextResponse.json({ reply, intent: parsed.intent });
}