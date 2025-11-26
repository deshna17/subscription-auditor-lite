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

// Detect if the assistant is asking a follow-up question
function isQuestionTurn(text: string) {
  return /first question|second question|third question|next question|let's continue/i.test(
    text
  );
}

// Detect when assistant wants to auto-continue
function wantsAutoContinue(text: string) {
  return /give me a moment|processing|hold on|one sec|let me think/i.test(text);
}

export async function POST(req: Request) {
  const body = await req.json();
  const history: ChatMessage[] = body.history || [];
  const latestUserContent =
    history.length > 0 ? history[history.length - 1].content : body.message;

  // 🔥 STEP 1 — FETCH LAST ASSISTANT TURN
  const lastAssistant = history
    .filter((m) => m.role === "assistant")
    .slice(-1)[0];

  const assistantText = lastAssistant?.content || "";

  // 🔥 STEP 2 — AUTO-CONTINUE LOGIC (NO USER INPUT REQUIRED)
  if (assistantText && wantsAutoContinue(assistantText)) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
      ],
    });

    return NextResponse.json({
      role: "assistant",
      content: completion.choices[0].message?.content || "Continuing...",
    });
  }

  // 🔥 STEP 3 — DO RAG + SEARCH ONLY ON USER SUBSCRIPTION LIST (NOT ON EVERY TURN)
  let rag: any = null;
  let web: any = null;

  const userJustListedSubs =
    /netflix|spotify|notion|premium|subscription|₹|\$|mo|month/i.test(
      latestUserContent
    ) && history.length < 3;

  if (userJustListedSubs) {
    rag = await runRAG(latestUserContent);
    web = await exaSearch(latestUserContent);
  }

  const context = `RAG RESULTS:
${JSON.stringify(rag, null, 2)}

WEB SEARCH RESULTS:
${JSON.stringify(web, null, 2)}
`;

  // 🔥 STEP 4 — BUILD FULL MESSAGE ARRAY
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (userJustListedSubs) {
    messages.push({ role: "system", content: context });
  }

  for (const m of history) {
    messages.push({
      role: m.role,
      content: m.content,
    });
  }

  // 🔥 STEP 5 — FORCE 1 QUESTION AT A TIME
  if (assistantText && isQuestionTurn(assistantText)) {
    messages.push({
      role: "assistant",
      content:
        "Please answer the previous question so we can continue with the evaluation.",
    });
  }

  // 🔥 STEP 6 — CALL OPENAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages,
  });

  const text = completion.choices[0].message?.content || "No answer.";

  return NextResponse.json({ role: "assistant", content: text });
}
