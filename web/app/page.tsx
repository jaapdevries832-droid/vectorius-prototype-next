"use client";

import React, { useEffect, useState } from "react";
import Container from "../components/Container";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import Pill from "../components/Pill";
import {
  resolveStudentIdsForRole,
  listAssignmentsByStudentIds,
  listAssignmentsDueInDays,
  Assignment,
} from "../lib/api";

function fmtDate(iso?: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "—";
}

export default function HomePage() {
  const [role, setRole] = useState("Student");
  const [nav, setNav] = useState("home");
  const [plan, setPlan] = useState<Assignment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const studentIds = await resolveStudentIdsForRole(role as any);
        const [p, a] = await Promise.all([
          listAssignmentsDueInDays(studentIds, 14),
          listAssignmentsByStudentIds(studentIds, 100),
        ]);
        setPlan(p);
        setAssignments(a);
      } catch (e: any) {
        setError(e.message);
      }
    }
    load();
  }, [role]);

  return (
    <Container>
      <Topbar role={role} onChangeRole={setRole} envBanner={null} />
      <div className="flex">
        <Sidebar role={role} current={nav} onNav={setNav} />
        <main className="flex-1 p-6 space-y-6">
          {error && <div className="text-red-600">Error: {error}</div>}

          <Card title="Plan (next 14 days)">
            {plan.length === 0 ? (
              <div className="text-sm text-gray-500">No upcoming work</div>
            ) : (
              <ul className="space-y-2">
                {plan.map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span>{a.title}</span>
                    <span className="text-sm text-gray-600">Due {fmtDate(a.dueAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Assignments">
            {assignments.length === 0 ? (
              <div className="text-sm text-gray-500">No assignments</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Due</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="py-2 pr-4">{a.title}</td>
                      <td className="py-2 pr-4">{fmtDate(a.dueAt)}</td>
                      <td className="py-2 pr-4"><Pill intent="info">{a.status.replace("_", " ")}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Progress">
            <ProgressBar label="Demo" value={60} />
          </Card>
        </main>
      </div>
    </Container>
  );
}
