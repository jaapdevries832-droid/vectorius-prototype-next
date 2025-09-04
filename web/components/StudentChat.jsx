"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import ModeSelector from "./ModeSelector";

// Real student chat backed by /api/chat with mode selector.
// Props: { studentId: string, studentName: string, initialMessages?: Array }
export default function StudentChat({ studentId, studentName, initialMessages = [] }) {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  // Mode state, persisted across reloads (global for student chat)
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem("vectorius:studentChatMode");
      if (saved && ["tutor", "checker", "explainer"].includes(saved)) return saved;
    } catch {}
    return "tutor";
  });

  // Minimal tutoring system prompt (client-side context only)
  const systemPrompt = useMemo(() => {
    const name = (studentName || "the student").toString();
    return (
      `You are a kind, precise tutoring assistant. Address ${name} by name, ask brief, guiding questions, ` +
      `and prefer step-by-step hints over final answers unless asked. Use Markdown for math and clarity.`
    );
  }, [studentName]);

  const storageKey = useMemo(
    () => (studentId ? `student-chat:${studentId}` : `student-chat:__none__`),
    [studentId],
  );

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    const base = [{ role: "system", content: systemPrompt }];
    return [...base, ...initialMessages];
  });

  // Reload conversation when student changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setMessages(JSON.parse(raw));
        return;
      }
    } catch {}
    setMessages([{ role: "system", content: systemPrompt }]);
    setInput("");
    setError(null);
  }, [storageKey, systemPrompt]);

  // Persist per-student conversation
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages, storageKey]);

  // Feature flag: check if server chat is enabled (envs present)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setEnabled(Boolean(data?.enabled));
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setLoading(true);
    setError(null);

    const trimmedHistory = messages.slice(-9);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, mode, history: trimmedHistory, studentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Request failed");
        return;
      }
      const reply = data?.reply || data?.content || "";
      setMessages([
        ...trimmedHistory,
        { role: "user", content: question },
        { role: "assistant", content: reply },
      ]);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
      setInput("");
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div>
      <ModeSelector mode={mode} onChange={setMode} />

      {!enabled && (
        <div className="mb-2 text-xs px-2 py-1 rounded border bg-amber-50 text-amber-800">
          Chat disabled—missing server configuration.
        </div>
      )}

      <div className="border rounded p-3 h-48 overflow-auto bg-gray-50 text-sm mb-2">
        {messages.filter((m) => m.role !== "system").length === 0 ? (
          <div className="text-gray-400">No messages yet.</div>
        ) : (
          messages
            .filter((m) => m.role !== "system")
            .slice(-20)
            .map((m, i) => (
              <div
                key={i}
                className={m.role === "assistant" ? "text-indigo-800 mb-1" : "text-gray-900 mb-1"}
              >
                <span className="font-semibold">{m.role === "assistant" ? "AI" : "You"}:</span>{" "}
                <span className="prose prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </span>
              </div>
            ))
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder={
            !enabled
              ? "Chat unavailable"
              : mode === "checker"
                ? "Paste your attempt to check"
                : mode === "explainer"
                  ? "Ask for a clear explanation"
                  : "Ask for a hint"
          }
          disabled={!enabled || loading}
        />
        <button
          className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
          disabled={!enabled || loading || !input.trim()}
          onClick={() => void send()}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
      {error && <div className="text-xs text-red-600 mt-1">{String(error)}</div>}
    </div>
  );
}
