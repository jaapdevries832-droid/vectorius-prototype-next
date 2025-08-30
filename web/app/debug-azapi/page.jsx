"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import ModeSelector from "../../components/ModeSelector";

export default function DebugAzureAPIPage() {
  const [mode, setMode] = useState("tutor"); // "tutor" | "checker" | "explainer"
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // [{role, content}]
  const inputRef = useRef(null);

  async function sendMessage() {
    const question = input.trim();
    if (!question || loading) return;

    setLoading(true);
    setReply("");

    // Build minimal history; keep it small to avoid long contexts
    const trimmedHistory = history.slice(-8);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          mode,
          history: trimmedHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReply(data?.error ? `❌ ${data.error}` : "❌ Request failed");
      } else {
        setReply(data.reply || "");
        // append last turn to history (user + assistant)
        setHistory([
          ...trimmedHistory,
          { role: "user", content: question },
          { role: "assistant", content: data.reply || "" },
        ]);
      }
    } catch (e) {
      setReply(`❌ ${e.message || String(e)}`);
    } finally {
      setLoading(false);
      setInput("");
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearThread() {
    setHistory([]);
    setReply("");
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-1">Debug: Azure OpenAI API</h1>
      <p className="text-sm text-gray-600 mb-4">
        Uses <code>/api/chat</code> with Markdown prompts from <code>/prompts</code>. Switch modes and send quick tests.
      </p>

      <ModeSelector mode={mode} onChange={setMode} />

      <div className="border rounded p-3 mb-3 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your message
        </label>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder={
            mode === "tutor"
              ? "Ask for a hint (e.g., Help me solve 2x + 5 = 17)"
              : mode === "checker"
              ? "Paste your attempt to get rubric + fixes"
              : "Ask for a short concept explanation"
          }
          disabled={loading}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className={
              "px-4 py-2 rounded text-white " +
              (loading || !input.trim()
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700")
            }
          >
            {loading ? "Sending..." : "Send"}
          </button>
          <button
            onClick={clearThread}
            className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="border rounded p-3 bg-gray-50 prose max-w-none">
        <div className="text-sm text-gray-700 mb-1 font-semibold">Assistant reply</div>
            {reply ? (
                 <ReactMarkdown>{reply}</ReactMarkdown>
         ) : (
            <span className="text-gray-400">No reply yet.</span>
        )}
        </div>

      {/* <div className="border rounded p-3 bg-gray-50 whitespace-pre-wrap">
        <div className="text-sm text-gray-700 mb-1 font-semibold">Assistant reply</div>
        {reply ? reply : <span className="text-gray-400">No reply yet.</span>}
      </div> */}

      <div className="border rounded p-3 mt-3 bg-white">
        <div className="text-sm text-gray-700 mb-2 font-semibold">Conversation (last 10 turns)</div>
        {history.length === 0 ? (
          <div className="text-gray-400 text-sm">Empty</div>
        ) : (
            <ul className="space-y-2 text-sm">
            {history.slice(-10).map((m, idx) => (
                <li key={idx} className="flex gap-2">
                <span
                    className={
                    "inline-block min-w-[84px] text-xs font-semibold px-2 py-0.5 rounded " +
                    (m.role === "user"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-green-100 text-green-800")
                    }
                >
                    {m.role}
                </span>

                {/* markdown-rendered message */}
                <div className="flex-1 prose max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
                </li>
            ))}
            </ul>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-4">
        Mode: <code>{mode}</code>
      </div>
    </div>
  );
}
