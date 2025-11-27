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

function HealthBar({ score }: { score: number }) {
  let color = "health-red";
  if (score >= 80) color = "health-green";
  else if (score >= 50) color = "health-yellow";

  return (
    <div className="health-bar">
      <div
        className={`health-fill ${color}`}
        style={{ width: `${score}%` }}
      ></div>
    </div>
  );
}

// Markdown Wrapper
const Markdown: React.FC<{ children: string }> = ({ children }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
  // Chat history
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m Kill Bill 👋\n\n" +
        "To begin, please list ONLY the names of your paid subscriptions (e.g., Netflix, Spotify, Notion).\n" +
        "Also tell me your country/currency.\n\n" +
        "After that, I will ask short usage questions one by one.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // AUTO-CONTINUE HANDLER
  useEffect(() => {
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];

    // Detect “give me a moment”
    if (
      last.role === "assistant" &&
      /give me a moment|processing|one sec|hold on|let me prepare|let me think/i.test(
        last.content
      )
    ) {
      // Auto-send empty message to trigger next backend step
      sendMessageInternal("");
    }
  }, [messages]);

  // ---- INTERNAL SEND (backend call) ----
  async function sendMessageInternal(userMessage: string) {
    const newHistory = [...messages];

    if (userMessage.trim().length > 0) {
      newHistory.push({ role: "user", content: userMessage });
      setMessages(newHistory);
    }

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newHistory, // backend needs “history”
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ---- PUBLIC SEND (user triggered) ----
  function sendMessage() {
    if (!input.trim() || loading) return;
    sendMessageInternal(input.trim());
    setInput("");
  }

  // Submit handler
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  // Enter key behaviour
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
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
          <h1>Kill Bill</h1>
          <p className="subtitle">
            The smartest way to kill your bills!
          </p>
        </div>
      </header>
