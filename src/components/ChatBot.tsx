"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
}

function generateSessionId() {
  return "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hey! Need help? I can show you how to submit a repo, find trending projects, or explain how voting works. What are you looking for?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const sessionRef = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sessionRef.current = generateSessionId();

    // Auto-open after 3 seconds on first visit (once per session)
    const shown = sessionStorage.getItem("pmg_chat_shown");
    if (!shown) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("pmg_chat_shown", "1");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: sessionRef.current }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply || "Something went wrong." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Couldn't reach the server. Try again." }]);
    }
    setSending(false);
  }, [input, sending]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed z-50 flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110"
          style={{
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            background: "var(--gradient-accent)",
            border: "none",
            color: "#fff",
            fontSize: 24,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className="fixed z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            bottom: 24,
            right: 24,
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            height: 500,
            maxHeight: "calc(100vh - 48px)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: "var(--gradient-accent)" }}
          >
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-sm font-semibold text-white">PimpMyGit Bot</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white cursor-pointer hover:opacity-80"
              style={{ background: "transparent", border: "none", fontSize: 18, lineHeight: 1 }}
              aria-label="Close chat"
            >
              &#x2715;
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "var(--bg)" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="rounded-xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap"
                  style={
                    m.role === "user"
                      ? { background: "var(--accent)", color: "#fff" }
                      : { background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-3 shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              maxLength={500}
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="px-3 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff", border: "none" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
