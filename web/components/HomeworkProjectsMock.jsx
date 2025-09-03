// @ts-nocheck
"use client";
import React from "react";

const DEFAULT = [
  { id: "h1", title: "Math worksheet: Quadratics", type: "Homework" },
  { id: "h2", title: "Science project: Density demo", type: "Project" },
];

export default function HomeworkProjectsMock({ items }) {
  const list = items && items.length ? items : DEFAULT;
  return (
    <ul className="list-disc ml-5 space-y-1 text-sm">
      {list.map((x) => (
        <li key={x.id}>
          <span className="font-medium">{x.type}:</span> {x.title}
        </li>
      ))}
    </ul>
  );
}
