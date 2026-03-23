"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey Rene. Tell me anything about yourself -- experiences, projects, skills, corrections. I'll remember what matters.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const passwordRef = useRef("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleAuth() {
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput }),
    });
    if (res.ok) {
      passwordRef.current = passwordInput;
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": passwordRef.current,
        },
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
          content: "Something went wrong. Try again.",
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

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm space-y-4">
          <h1 className="text-lg font-semibold">Admin Access</h1>
          <input
            type="password"
            className="w-full bg-gray-700 text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            placeholder="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          {authError && (
            <p className="text-red-400 text-sm">Incorrect password.</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Admin</h1>
        <p className="text-sm text-gray-400">
          Feed your AI information about yourself
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-3 rounded-2xl text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            className="flex-1 bg-gray-800 text-gray-100 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            rows={3}
            placeholder="Tell me something about yourself..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}