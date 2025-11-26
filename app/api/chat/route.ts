import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../../lib/prompt";
import { runRAG } from "../../lib/rag";
import { exaSearch } from "../../lib/search";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = body.message as string;

    if (!user || typeof user !== "string") {
      return NextResponse.json(
        { role: "assistant", content: "Please send a text message." },
        { status: 400 }
      );
    }

    const rag = await runRAG(user);
    const web = await exaSearch(user);

    const context = `RAG RESULTS:\n${JSON.stringify(
      rag,
      null,
      2
    )}\n\nWEB SEARCH RESULTS:\n${JSON.stringify(web, null, 2)}\n`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: context },
        { role: "user", content: user },
      ],
    });

    const text = completion.choices[0].message?.content ?? "No answer.";

    return NextResponse.json({ role: "assistant", content: text });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    return NextResponse.json(
      {
        role: "assistant",
        content: "Server error while processing your request.",
      },
      { status: 500 }
    );
  }
}
