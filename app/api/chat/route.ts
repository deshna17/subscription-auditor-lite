import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../../lib/prompt";
import { runRAG } from "../../lib/rag";
import { exaSearch } from "../../lib/search";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  phase?: "phase0" | "phase1" | "phase2";
};

export async function POST(req: Request) {
  const body = await req.json();
  const messagesFromClient: ChatMessage[] = body.messages || [];

  // If no chat history → PHASE 0
  let currentPhase: "phase0" | "phase1" | "phase2" = "phase0";

  const lastUser = [...messagesFromClient].reverse().find((m) => m.role === "user");

  // Detect if subs were listed
  const subsListed = messagesFromClient.some((m) =>
    /(netflix|spotify|notion|chatgpt|claude|prime|youtube|icloud|figma|canva)/i.test(m.content)
  );

  // Detect if answers to usage questions are present
  const hasUsageAnswers = messagesFromClient.some((m) =>
    /(daily|weekly|monthly|rarely)/i.test(m.content)
  );

  const hasImportance = messagesFromClient.some((m) =>
    /(1|2|3|4|5)/.test(m.content)
  );

  const hasCountry = messagesFromClient.some((m) =>
    /(india|usa|uk|europe|₹|\$|€)/i.test(m.content)
  );

  // PHASE DECISION LOGIC
  if (!subsListed || !hasCountry) {
    currentPhase = "phase0";
  } else if (subsListed && (!hasUsageAnswers || !hasImportance)) {
    currentPhase = "phase1";
  } else {
    currentPhase = "phase2";
  }

  let ragContext = "";
  let webContext = "";

  // Only run RAG/web in PHASE 2
  if (currentPhase === "phase2") {
    const rag = await runRAG(lastUser?.content || "");
    const web = await exaSearch(lastUser?.content || "");

    ragContext = JSON.stringify(rag, null, 2);
    webContext = JSON.stringify(web, null, 2);
  }

  const finalMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT + `\nCURRENT_PHASE: ${currentPhase}`
    },
    currentPhase === "phase2"
      ? {
          role: "system",
          content: `RAG RESULTS:\n${ragContext}\n\nWEB RESULTS:\n${webContext}`
        }
      : { role: "system", content: "No RAG/Web context yet — still in interview (phase0/phase1)." },
    ...messagesFromClient
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: finalMessages
  });

  const reply = completion.choices[0]?.message?.content || "Error.";

  return NextResponse.json({
    role: "assistant",
    content: reply,
    phase: currentPhase
  });
}
