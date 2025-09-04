"use client";
import React from "react";

type Intent = "info" | "success" | "warning" | "danger" | "neutral";

const styles: Record<Intent, string> = {
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  success: "bg-green-50 text-green-700 ring-green-200",
  warning: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-gray-100 text-gray-700 ring-gray-200",
};

type Props = {
  intent?: Intent;
  children: React.ReactNode;
};

export default function Pill({ intent = "neutral", children }: Props) {
  const cls = styles[intent] || styles.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}
