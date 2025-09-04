"use client";
import React from "react";

type Props = {
  intent?: "info" | "warning" | "error" | "success";
  children: React.ReactNode;
};

const colors: Record<NonNullable<Props["intent"]>, string> = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  warning: "bg-yellow-50 text-yellow-900 border-yellow-300",
  error: "bg-red-50 text-red-800 border-red-200",
  success: "bg-green-50 text-green-800 border-green-200",
};

export default function Alert({ intent = "info", children }: Props) {
  return <div className={`border rounded px-3 py-2 text-sm ${colors[intent]}`}>{children}</div>;
}
