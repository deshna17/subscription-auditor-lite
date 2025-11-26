import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../../lib/prompt";
import { runRAG } from "../../lib/rag";
import { exaSearch } from "../../lib/search";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const body = await req.json();

  // Full history
  const history: ChatMessage[] = body.history ?? [];

  // Latest user message
  const latestUserContent: string = body.message;

  // RAG + Web Search only for latest user query
  const rag = await runRAG(latestUserContent);
  const web = await exaSearch(latestUserContent);

  const context = `
RAG RESULTS:
${JSON.stringify(rag, null, 2)}

WEB SEARCH RESULTS:
${JSON.stringify(web, null, 2)}
`;

  // Message array
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: context },
  ];

  // Add history properly
  history.forEach((m) =>
    messages.push({
      role: m.role,
      content: m.content,
    })
  );

  // Add the latest user turn
  messages.push({ role: "user", content: latestUserContent });

  // Detect auto-continue
  const lastAssistant = history.filter((m) => m.role === "assistant").pop();
  if (lastAssistant && lastAssistant.content.includes("Give me a moment")) {
    messages.push({
      role: "system",
      content:
        "You previously said 'Give me a moment' — now continue Phase 2 analysis immediately.",
    });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages,
  });

  const text = completion.choices[0].message?.content || "No answer.";

  return NextResponse.json({ role: "assistant", content: text });
}
