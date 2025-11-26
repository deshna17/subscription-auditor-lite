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

  // Full chat history sent from frontend
  const history: ChatMessage[] | undefined = body.history;

  // Latest user message content (for RAG/web search)
  const latestUserContent: string =
    history && history.length > 0
      ? history[history.length - 1].content
      : body.message;

  // RAG + web search on latest user question / statement
  const rag = await runRAG(latestUserContent);
  const web = await exaSearch(latestUserContent);

  const context = `
RAG RESULTS:
${JSON.stringify(rag, null, 2)}

WEB SEARCH RESULTS:
${JSON.stringify(web, null, 2)}
`;

  // Build message array for OpenAI
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: context },
  ];

  if (history && history.length > 0) {
    // Attach full dialogue so far
    for (const m of history) {
      messages.push({
        role: m.role,
        content: m.content,
      });
    }
  } else {
    // Fallback: only latest user input
    messages.push({ role: "user", content: latestUserContent });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages,
  });

  const text = completion.choices[0].message?.content || "No answer.";

  return NextResponse.json({ role: "assistant", content: text });
}
