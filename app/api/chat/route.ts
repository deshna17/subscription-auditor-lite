import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/app/lib/prompt";
import { runRAG } from "@/app/lib/rag";
import { exaSearch } from "@/app/lib/search";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const body = await req.json();
  const user = body.message;

  const rag = await runRAG(user);
  const web = await exaSearch(user);

  const context = `
RAG RESULTS:
${JSON.stringify(rag, null, 2)}

WEB SEARCH RESULTS:
${JSON.stringify(web, null, 2)}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: context },
      { role: "user", content: user }
    ]
  });

  const text = completion.choices[0].message?.content || "No answer.";

  return NextResponse.json({ role: "assistant", content: text });
}

