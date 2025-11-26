import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../../lib/prompt";
import { runRAG } from "../../lib/rag";
import { exaSearch } from "../../lib/search";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Basic chat message structure
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const body = await req.json();

  // The frontend must send: { messages: [...] }
  const messagesFromClient: ChatMessage[] = body.messages || [];

  // Extract the latest user message
  const lastUserMsg =
    [...messagesFromClient].reverse().find((m) => m.role === "user")?.content ||
    "";

  // Determine whether user has listed subscriptions yet
  const userHasListedSubscriptions = messagesFromClient.some((m) =>
    /(netflix|spotify|notion|chatgpt|prime|apple|dropbox|adobe|canva|figma|amazon|youtube)/i.test(
      m.content
    )
  );

  let ragContext = "";
  let webContext = "";

  // 🔥 Only run RAG + Web Search AFTER user has listed subscriptions
  if (userHasListedSubscriptions) {
    const rag = await runRAG(lastUserMsg);
    const web = await exaSearch(lastUserMsg);

    ragContext = JSON.stringify(rag, null, 2);
    webContext = JSON.stringify(web, null, 2);
  }

  // Build messages array for OpenAI
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },

    // Inject RAG/Web only AFTER Phase-1
    userHasListedSubscriptions
      ? {
          role: "system",
          content: `RAG RESULTS:\n${ragContext}\n\nWEB RESULTS:\n${webContext}`,
        }
      : { role: "system", content: "No RAG or web context yet." },

    // Add all user + assistant messages so far
    ...messagesFromClient.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages,
  });

  const text = completion.choices[0]?.message?.content || "No response.";

  return NextResponse.json({ role: "assistant", content: text });
}
