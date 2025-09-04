"use client";
import React from "react";

type Props = {
  children: React.ReactNode;
  title: string;
  right?: React.ReactNode;
};

export default function Card({ children, title, right }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
