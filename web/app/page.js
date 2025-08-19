// web/app/page.js
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import './globals.css';
import ProgressBar from "../components/ProgressBar";
import Pill from "../components/Pill";
import { listAllAssignments, listThisWeeksPlan } from "../lib/api";

/* ---------------- UI shells ---------------- */

const Container = ({ children }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>
);

function Topbar({ role, onChangeRole, envBanner }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 border">Vectorius Prototype</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">Demo</span>
          {envBanner}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm opacity-70">Impersonate role:</label>
          <select
            value={role}
            onChange={(e) => onChangeRole(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option>Student</option>
            <option>Parent</option>
            <option>Mentor</option>
          </select>
        </div>
      </div>
    </header>
  );
}

const Sidebar = ({ role, current, onNav }) => {
  const nav = [
    { key: 'home', label: 'Home' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'settings', label: 'Settings' },
  ];
  return (
    <aside className="hidden md:block w-64 border-r border-gray-200 bg-white">
      <nav className="p-4 space-y-1">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{role} dashboard</div>
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
              current === item.key ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

const Page = ({ children, title, right }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
    <div className="px-4 py-3 border-b flex items-center justify-between">
      <h3 className="font-semibold">{title}</h3>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

/* --------------- Demo fallback --------------- */

const DEMO_PLAN = [
  { id: 'd1', title: 'Algebra: Quadratics p.42', status: 'in_progress', due_at: '2025-08-12T00:00:00Z' },
  { id: 'd2', title: 'Science Lab: Density', status: 'todo',        due_at: '2025-08-20T00:00:00Z' },
  { id: 'd3', title: 'English Essay: Hero’s Journey', status: 'done', due_at: '2025-08-22T00:00:00Z' },
];

const DEMO_ASSIGNMENTS = [
  { id: 'a1', title: 'Algebra: Quadratics p.42', status: 'in_progress', due_at: '2025-08-12T00:00:00Z' },
  { id: 'a2', title: 'Science Lab: Density',     status: 'todo',        due_at: '2025-08-20T00:00:00Z' },
  { id: 'a3', title: 'English Essay: Hero’s Journey', status: 'done',   due_at: '2025-08-22T00:00:00Z' },
];

/* --------------- Helpers --------------- */

const fmtDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '—');

const statusToIntent = (s) => {
  if (s === 'done') return 'success';
  if (s === 'in_progress') return 'info';
  if (s === 'blocked') return 'warning';
  return 'default';
};

/* --------------- Main ---------------- */

export default function HomePage() {
  const [role, setRole] = useState('Student');
  const [tab, setTab] = useState('home');

  const [livePlan, setLivePlan] = useState(null);
  const [liveAssignments, setLiveAssignments] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch live data once on load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [plan, all] = await Promise.all([
          listThisWeeksPlan(14),   // 2-week window reads better in demos
          listAllAssignments(200),
        ]);
        if (!mounted) return;
        setLivePlan(plan);
        setLiveAssignments(all);
      } catch (e) {
        if (!mounted) return;
        setLiveError(e?.message ?? 'fetch failed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const planItems = useMemo(() => {
    if (livePlan && livePlan.length) return livePlan;
    return DEMO_PLAN;
  }, [livePlan]);

  const tableItems = useMemo(() => {
    if (liveAssignments && liveAssignments.length) return liveAssignments;
    return DEMO_ASSIGNMENTS;
  }, [liveAssignments]);

  const envBanner = liveAssignments
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Live data</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">Demo data</span>;

  return (
    <Container>
      <Topbar role={role} onChangeRole={setRole} envBanner={envBanner} />
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
        <Sidebar role={role} current={tab} onNav={setTab} />
        <main className="space-y-6">
          {liveError && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Backend read failed: <span className="font-mono">{liveError}</span>. Falling back to demo rows.
            </div>
          )}

          {/* This Week's Plan */}
          <Page
            title="This Week’s Plan"
            right={<Pill intent={liveAssignments ? 'success' : 'info'}>{liveAssignments ? 'Live' : 'Demo'}</Pill>}
          >
            {loading && !liveAssignments && (
              <div className="text-sm opacity-70">Loading…</div>
            )}
            <div className="space-y-3">
              {planItems.map((a) => (
                <div key={a.id || a.title} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-gray-600">
                      Due {fmtDate(a.due_at)}
                    </div>
                  </div>
                  <Pill intent={statusToIntent(a.status)}>
                    {a.status === 'in_progress' ? 'In Progress'
                      : a.status === 'todo' ? 'Not Started'
                      : a.status === 'done' ? 'Done'
                      : a.status}
                  </Pill>
                </div>
              ))}
            </div>
          </Page>

          {/* Homework & Projects */}
          <Page
            title="Homework & Projects"
            right={
              <select className="text-sm border rounded px-2 py-1">
                <option>All</option>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Due</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableItems.map((a) => (
                    <tr key={a.id || a.title} className="border-t hover:bg-gray-50">
                      <td className="py-2 pr-4">{a.title}</td>
                      <td className="py-2 pr-4">{fmtDate(a.due_at)}</td>
                      <td className="py-2 pr-4">
                        <Pill intent={statusToIntent(a.status)}>
                          {a.status === 'in_progress' ? 'In Progress'
                            : a.status === 'todo' ? 'Not Started'
                            : a.status === 'done' ? 'Done'
                            : a.status}
                        </Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Page>

          {/* Progress block — still demo for now */}
          <Page title="Your Progress">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Math</span><span>78%</span>
                </div>
                <ProgressBar value={78} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Science</span><span>52%</span>
                </div>
                <ProgressBar value={52} />
              </div>
            </div>
          </Page>

          {/* AI assistant placeholder */}
          <Page title="Ask AI (Mock)">
            <div className="text-sm text-gray-700 leading-6">
              <div className="uppercase text-xs text-gray-500 mb-2">Assistant</div>
              <p>Hi! I’m your study buddy. Ask me about any assignment.</p>
            </div>
          </Page>
        </main>
      </div>
    </Container>
  );
}
