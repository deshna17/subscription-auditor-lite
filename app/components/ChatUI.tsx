"use client";

import React, {
  useState,
  useRef,
  useEffect,
  FormEvent,
  KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Small helper so TypeScript chill rahe
const Markdown: React.FC<{ children: string }> = ({ children }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // basic styling hooks for table / lists / headings
      components={
        {
          table: (props) => <table className="msg-table" {...props} />,
          thead: (props) => <thead {...props} />,
          tbody: (props) => <tbody {...props} />,
          tr: (props) => <tr {...props} />,
          th: (props) => <th className="msg-th" {...props} />,
          td: (props) => <td className="msg-td" {...props} />,
          p: (props) => <p className="msg-p" {...props} />,
          ul: (props) => <ul className="msg-ul" {...props} />,
          li: (props) => <li className="msg-li" {...props} />,
          h2: (props) => <h2 className="msg-h2" {...props} />,
          h3: (props) => <h3 className="msg-h3" {...props} />,
        } as any
      }
    >
      {children}
    </ReactMarkdown>
  );
};

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([
  {
    role: "assistant",
    content:
      "Hi, I’m Subscription Auditor (Lite) 👋\n\n" +
      "Paste or type your paid subscriptions with approx monthly prices.\n" +
      "Example:\n" +
      "- Netflix – ₹649/mo\n" +
      "- Spotify – ₹119/mo\n" +
      "- Notion – $8/mo\n" +
      "- ChatGPT Plus – $20/mo\n\n" +
      "Then I’ll ask 2–3 quick questions and show where you can save the most.",
  },
]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
  const text = input.trim();
  if (!text || loading) return;

  const userMessage: Message = { role: "user", content: text };

  // Update UI
  setMessages((prev) => [...prev, userMessage]);
  setInput("");
  setLoading(true);

  try {
    // Send FULL history (including the just-added user message)
    const historyToSend = [...messages, userMessage];

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: historyToSend }),
    });

    if (!res.ok) {
      throw new Error("API error");
    }

    const data: { role?: string; content?: string } = await res.json();

    const assistantMessage: Message = {
      role: "assistant",
      content:
        data.content ??
        "Sorry, I couldn’t generate a response. Please try again.",
    };

    setMessages((prev) => [...prev, assistantMessage]);
  } catch (err) {
    console.error("Chat error:", err);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Sorry, something went wrong while talking to the model. Try again in a moment.",
      },
    ]);
  } finally {
    setLoading(false);
  }
}

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = send, Shift+Enter = newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <div className="emoji">📋</div>
        <div>
          <h1>Subscription Auditor (Lite)</h1>
          <p className="subtitle">
            Enter subscriptions or ask for cheaper / smarter AI alternatives.
          </p>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Try asking things like:</p>
            <ul>
              <li>“Claude vs ChatGPT vs Gemini – best 3 for coding?”</li>
              <li>“I pay for Notion, Canva and Figma – cheaper combo?”</li>
              <li>“Best AI stack for travel planning on a budget.”</li>
            </ul>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`message ${m.role === "user" ? "user" : "assistant"}`}
          >
            <div className="message-role">
              {m.role === "user" ? "You" : "AI"}
            </div>
            <div className="message-bubble">
              {m.role === "assistant" ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <Markdown>{m.content}</Markdown>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-role">AI</div>
            <div className="message-bubble typing">Thinking…</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-row">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your subscriptions or the AI use case you want to optimize…"
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Sending…" : "Ask"}
        </button>
      </form>

      <p className="hint">
        ↵ <strong>Enter</strong> to send,&nbsp;
        <span>Shift + Enter</span> for a new line.
      </p>
    </div>
  );
}
