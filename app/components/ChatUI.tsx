"use client";
import { useState } from "react";

export default function ChatUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const text = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error contacting AI." }
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="header">
        <div className="header-title">💳 Subscription Auditor (Lite)</div>
        <div className="header-subtitle">
          Enter subscriptions or ask for cheaper alternatives.
        </div>
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.role === "user" ? "msg-user" : "msg-ai"}`}
          >
            <strong>{m.role === "user" ? "You" : "AI"}:</strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: m.content }} />
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Type your subscriptions…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="chat-button" onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </>
  );
}

