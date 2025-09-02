import React from "react";

interface CardProps {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

export default function Card({ title, right, children }: CardProps) {
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
