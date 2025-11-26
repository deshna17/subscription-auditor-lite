import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// @ts-ignore – Pinecone client works with apiKey only; ignore TS complaining
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function runRAG(query: string) {
  try {
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const vector = emb.data[0].embedding;

    const index = pc.index("subscriptions");

    const result = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });

    return result.matches || [];
  } catch (err) {
    console.error("RAG error:", err);
    return [];
  }
}
