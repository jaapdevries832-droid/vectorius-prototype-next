// @ts-nocheck
"use client";
import React, { useState } from "react";

export default function ChatMock() {
  const [messages, setMessages] = useState([
    { id: 1, from: "ai", text: "Hi! How can I help with your homework today?" },
  ]);
  const [draft, setDraft] = useState("");

  return (
    <div>
      <div className="border rounded p-3 h-40 overflow-auto bg-gray-50 text-sm mb-2">
        {messages.map((m) => (
          <div key={m.id} className={m.from === "ai" ? "text-indigo-800" : "text-gray-900"}>
            <span className="font-semibold">{m.from === "ai" ? "AI" : "You"}:</span> {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Type a message (mock only)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm disabled:opacity-50"
          disabled={!draft.trim()}
          onClick={() => {
            const txt = draft.trim();
            setDraft("");
            setMessages((prev) => [...prev, { id: prev.length + 1, from: "me", text: txt }]);
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                { id: prev.length + 1, from: "ai", text: "Thanks! I'm just a mock here." },
              ]);
            }, 400);
          }}
        >
          Send
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-1">Mock UI only; no backend.</div>
    </div>
  );
}
