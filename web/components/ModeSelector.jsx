"use client";
import React, { useEffect, useState } from "react";

// Three-position mode selector with persistence
// - Props: mode, onChange(mode), className?
// - Persists to localStorage key: vectorius:studentChatMode

const STORAGE_KEY = "vectorius:studentChatMode";

export default function ModeSelector({ mode: externalMode, onChange, className = "" }) {
  const [mode, setMode] = useState(externalMode || "tutor");

  // Initialize from localStorage on mount if parent didn't provide
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ["tutor", "checker", "explainer"].includes(saved)) {
        setMode(saved);
        if (onChange) onChange(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync internal state when externalMode changes
  useEffect(() => {
    if (externalMode && externalMode !== mode) setMode(externalMode);
  }, [externalMode]);

  function handleChange(next) {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    if (onChange) onChange(next);
  }

  const opts = [
    { key: "tutor", label: "Tutor" },
    { key: "checker", label: "Checker" },
    { key: "explainer", label: "Explainer" },
  ];

  return (
    <div className={`flex items-center gap-2 mb-3 ${className}`}>
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => handleChange(o.key)}
          className={`px-3 py-1.5 rounded border text-sm capitalize ${
            mode === o.key ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
          }`}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
