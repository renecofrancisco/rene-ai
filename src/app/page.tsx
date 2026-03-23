"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PublicPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm Rene Francisco. Feel free to ask me anything about my experience, skills, or background.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: updatedHistory,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold">Rene Francisco</h1>
        <p className="text-sm text-gray-500">
          Senior Full-Stack Software Engineer
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-900"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400"
            rows={3}
            placeholder="Ask me anything about my experience..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}