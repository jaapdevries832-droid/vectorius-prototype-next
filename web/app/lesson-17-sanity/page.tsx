"use client";
import { useState } from "react";

export default function Lesson17SanityPage() {
  const [count, setCount] = useState(0);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Lesson 17: Codex Sanity Check</h1>
      <p className="mt-2">This page proves local edits work. No env vars required.</p>
      <button
        className="mt-4 rounded-xl border px-4 py-2"
        onClick={() => setCount((c) => c + 1)}
        aria-label="increment"
      >
        Clicks: {count}
      </button>
    </main>
  );
}
