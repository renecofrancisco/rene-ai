import supabase from "./supabase";
import { embedText } from "./openai";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function storeMemory(content: string, category: string) {
  try {
    const embedding = await embedText(content);
    const embeddingString = `[${embedding.join(",")}]`;

    const { error } = await supabase.from("memories").insert({
      content,
      embedding: embeddingString,
      category,
    });

    if (error) throw new Error(`Failed to store memory: ${error.message}`);
  } catch (err) {
    console.error(`Failed to store memory: ${content.slice(0, 50)}`, err);
  }
}

export async function storeMemoriesSequentially(
  memories: { content: string; category: string }[]
) {
  for (const memory of memories) {
    await storeMemory(memory.content, memory.category);
    await delay(200);
  }
}

export async function retrieveMemories(
  question: string,
  limit: number = 5
): Promise<string[]> {
  const embedding = await embedText(question);
  const embeddingString = `[${embedding.join(",")}]`;

  const { data, error } = await supabase.rpc("match_memories", {
    query_embedding: embeddingString,
    match_threshold: 0.3,
    match_count: limit,
  });

  console.log("RPC data:", data);
  console.log("RPC error:", error);

  if (error) throw new Error(`Failed to retrieve memories: ${error.message}`);

  return data.map((row: { content: string }) => row.content);
}