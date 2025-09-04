"use client";
import React from "react";

type Props = {
  value: number; // 0..100
};

export default function ProgressBar({ value }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}
