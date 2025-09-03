// @ts-nocheck
"use client";
import React from "react";
import Pill from "./Pill";

const DEFAULT = [
  { id: "w1", title: "Read Ch. 3: Fractions", status: "in_progress", dueAt: null },
  { id: "w2", title: "Science: Lab prep notes", status: "todo", dueAt: null },
  { id: "w3", title: "History outline: WW1 causes", status: "todo", dueAt: null },
];

const statusToIntent = (s) => {
  if (s === "done") return "success";
  if (s === "in_progress") return "info";
  if (s === "blocked") return "warning";
  return "neutral";
};

export default function WeeklyPlanMock({ items }) {
  const plan = items && items.length ? items : DEFAULT;
  return (
    <div className="space-y-2">
      {plan.map((a) => (
        <div key={a.id} className="flex items-center justify-between">
          <div className="font-medium">{a.title}</div>
          <Pill intent={statusToIntent(a.status || "todo")}>{a.status || "todo"}</Pill>
        </div>
      ))}
      {!plan.length && <div className="text-sm text-gray-500">No items.</div>}
    </div>
  );
}
