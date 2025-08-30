"use client";

import React from "react";

const MODES = ["tutor", "checker", "explainer"];

export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="flex gap-2 mb-3">
      {MODES.map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={
              "px-3 py-1 rounded-full border transition " +
              (active
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100")
            }
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        );
      })}
    </div>
  );
}
