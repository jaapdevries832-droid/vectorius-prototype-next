"use client";
import React from "react";

type Props = { children: React.ReactNode };

export default function Container({ children }: Props) {
  return <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>;
}
