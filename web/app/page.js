// web/app/page.js
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import './globals.css';
import ProgressBar from "../components/ProgressBar";
import Pill from "../components/Pill";
import {
  resolveStudentIdsForRole,
  listAssignmentsByStudentIds,
  listAssignmentsDueInDays,
  getAnyAdvisorId,
  getAnyParentId,
  getStudentIdsForParent,
} from "../lib/api";
import { supabase } from "../lib/supabaseClient";

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

const Card = ({ children, title, right }) => (
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
  { id: 'd2', title: 'Science Lab: Density',     status: 'todo',        due_at: '2025-08-20T00:00:00Z' },
  { id: 'd3', title: 'English Essay: Hero’s Journey', status: 'done',   due_at: '2025-08-22T00:00:00Z' },
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

/* --------------- Mentor helpers --------------- */

async function fetchMentorRoster(advisorId) {
  const { data: rels, error: e1 } = await supabase
    .from('student_advisor')
    .select('student_id')
    .eq('advisor_id', advisorId);
  if (e1) throw e1;
  const studentIds = (rels ?? []).map(r => r.student_id);
  if (!studentIds.length) return [];
  const { data: students, error: e2 } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .in('id', studentIds)
    .order('last_name', { ascending: true });
  if (e2) throw e2;
  return students ?? [];
}

async function fetchRecentNotesForStudent(studentId, limit = 2) {
  const { data, error } = await supabase
    .from('notes')
    .select('id, body, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function insertMentorNote({ studentId, advisorId, body }) {
  const { error } = await supabase
    .from('notes')
    .insert({
      student_id: studentId,
      author_advisor_id: advisorId,
      body,
      visible_to_student: true,
      visible_to_parents: true,
    });
  if (error) throw error;
}

/* --------------- Main ---------------- */

export default function HomePage() {
  const [role, setRole] = useState('Student');
  const [tab, setTab] = useState('home');

  // Common data
  const [studentIds, setStudentIds] = useState([]);
  const [livePlan, setLivePlan] = useState(null);
  const [liveAssignments, setLiveAssignments] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parent state
  const [parentId, setParentId] = useState(null);
  const [parentChildren, setParentChildren] = useState([]); // [{id, first_name,last_name}]
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedChildNotes, setSelectedChildNotes] = useState([]);

  // Mentor state
  const [advisorId, setAdvisorId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [rosterQuery, setRosterQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentNotes, setSelectedStudentNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteStatus, setNoteStatus] = useState(null);

  // Load data when role changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setLiveError(null);

        if (role === 'Student') {
          const sids = await resolveStudentIdsForRole('Student');
          if (!mounted) return;
          setStudentIds(sids);
          const [plan, all] = await Promise.all([
            listAssignmentsDueInDays(sids, 14),
            listAssignmentsByStudentIds(sids, 200),
          ]);
          if (!mounted) return;
          setLivePlan(plan);
          setLiveAssignments(all);

          // clear other role state
          setParentId(null); setParentChildren([]); setSelectedChildId(null); setSelectedChildNotes([]);
          setAdvisorId(null); setRoster([]); setSelectedStudentId(null); setSelectedStudentNotes([]); setNoteDraft('');
        }

        if (role === 'Parent') {
          // find any parent id, then load their children for the selector
          const pid = await getAnyParentId();
          if (!mounted) return;
          setParentId(pid);
          const childIds = await getStudentIdsForParent(pid);
          if (!mounted) return;

          let children = [];
          if (childIds.length) {
            const { data, error } = await supabase
              .from('students')
              .select('id, first_name, last_name')
              .in('id', childIds)
              .order('last_name', { ascending: true });
            if (error) throw error;
            children = data ?? [];
          }
          setParentChildren(children);

          // default to first child
          const firstChild = children[0]?.id ?? null;
          setSelectedChildId(firstChild);

          if (firstChild) {
            const [plan, all, notes] = await Promise.all([
              listAssignmentsDueInDays([firstChild], 10),
              listAssignmentsByStudentIds([firstChild], 200),
              fetchRecentNotesForStudent(firstChild, 2),
            ]);
            if (!mounted) return;
            setStudentIds([firstChild]);
            setLivePlan(plan);
            setLiveAssignments(all);
            setSelectedChildNotes(notes);
          } else {
            setStudentIds([]);
            setLivePlan([]); setLiveAssignments([]); setSelectedChildNotes([]);
          }

          // clear mentor state
          setAdvisorId(null); setRoster([]); setSelectedStudentId(null); setSelectedStudentNotes([]); setNoteDraft('');
        }

        if (role === 'Mentor') {
          const aid = await getAnyAdvisorId();
          if (!mounted) return;
          setAdvisorId(aid);
          const r = await fetchMentorRoster(aid);
          if (!mounted) return;
          setRoster(r);
          const firstId = r[0]?.id ?? null;
          setSelectedStudentId(firstId);
          if (firstId) {
            const [plan, all, notes] = await Promise.all([
              listAssignmentsDueInDays([firstId], 14),
              listAssignmentsByStudentIds([firstId], 200),
              fetchRecentNotesForStudent(firstId, 2),
            ]);
            if (!mounted) return;
            setStudentIds([firstId]);
            setLivePlan(plan);
            setLiveAssignments(all);
            setSelectedStudentNotes(notes);
          } else {
            setLivePlan([]); setLiveAssignments([]); setSelectedStudentNotes([]);
          }

          // clear parent state
          setParentId(null); setParentChildren([]); setSelectedChildId(null); setSelectedChildNotes([]);
        }
      } catch (e) {
        if (!mounted) return;
        setLiveError(e?.message ?? 'fetch failed');
        setLivePlan(null);
        setLiveAssignments(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [role]);

  // Parent: switching selected child
  useEffect(() => {
    let mounted = true;
    if (role !== 'Parent' || !selectedChildId) return;
    (async () => {
      try {
        setLoading(true);
        const [plan, all, notes] = await Promise.all([
          listAssignmentsDueInDays([selectedChildId], 10),
          listAssignmentsByStudentIds([selectedChildId], 200),
          fetchRecentNotesForStudent(selectedChildId, 2),
        ]);
        if (!mounted) return;
        setStudentIds([selectedChildId]);
        setLivePlan(plan);
        setLiveAssignments(all);
        setSelectedChildNotes(notes);
      } catch (e) {
        if (!mounted) return;
        setLiveError(e?.message ?? 'fetch failed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [role, selectedChildId]);

  // Mentor: switching selected student
  useEffect(() => {
    let mounted = true;
    if (role !== 'Mentor' || !selectedStudentId) return;
    (async () => {
      try {
        setLoading(true);
        const [plan, all, notes] = await Promise.all([
          listAssignmentsDueInDays([selectedStudentId], 14),
          listAssignmentsByStudentIds([selectedStudentId], 200),
          fetchRecentNotesForStudent(selectedStudentId, 2),
        ]);
        if (!mounted) return;
        setStudentIds([selectedStudentId]);
        setLivePlan(plan);
        setLiveAssignments(all);
        setSelectedStudentNotes(notes);
      } catch (e) {
        if (!mounted) return;
        setLiveError(e?.message ?? 'fetch failed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [role, selectedStudentId]);

  const envBanner = liveAssignments
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Live data</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">Demo data</span>;

  const planItems = useMemo(() => (livePlan && livePlan.length ? livePlan : DEMO_PLAN), [livePlan]);
  const tableItems = useMemo(() => (liveAssignments && liveAssignments.length ? liveAssignments : DEMO_ASSIGNMENTS), [liveAssignments]);

  /* ---------------- Student/Parent dashboard ---------------- */

  const StudentLikeHome = () => (
    <>
      <Card
        title="This Week’s Plan"
        right={<Pill intent={liveAssignments ? 'success' : 'info'}>{liveAssignments ? 'Live' : 'Demo'}</Pill>}
      >
        {loading && !liveAssignments && <div className="text-sm opacity-70">Loading…</div>}
        <div className="space-y-3">
          {planItems.map((a) => (
            <div key={a.id || a.title} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-gray-600">Due {fmtDate(a.due_at)}</div>
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
      </Card>

      <Card title="Homework & Projects">
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
      </Card>

      {/* Mock progress */}
      <Card title="Your Progress">
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
      </Card>

      {/* Mock AI help */}
      <Card title="Ask AI (Mock)">
        <div className="text-sm text-gray-700 leading-6">
          <div className="uppercase text-xs text-gray-500 mb-2">Assistant</div>
          <p>Hi! I’m your study buddy. Ask me about any assignment.</p>
        </div>
      </Card>
    </>
  );

  /* ---------------- Parent dashboard (selector + progress + deadlines + notes) ---------------- */

  const ParentHome = () => {
    const selectedChild = parentChildren.find(c => c.id === selectedChildId);

    return (
      <>
        <Card
          title="Student Selector"
          right={null}
        >
          {parentChildren.length ? (
            <div className="flex items-center gap-3">
              <select
                className="text-sm border rounded px-2 py-1"
                value={selectedChildId ?? ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
              >
                {parentChildren.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                Viewing data for {selectedChild ? `${selectedChild.first_name} ${selectedChild.last_name}` : '—'}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No linked students.</div>
          )}
        </Card>

        <Card title="Progress Overview">
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
        </Card>

        <Card
          title="Upcoming Deadlines"
          right={<span className="text-xs text-gray-500">Next 7–10 days</span>}
        >
          <div className="space-y-3">
            {planItems.length ? planItems.map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-600">Due {fmtDate(a.due_at)}</div>
                </div>
                <Pill intent={statusToIntent(a.status)}>
                  {a.status === 'in_progress' ? 'In Progress'
                    : a.status === 'todo' ? 'Not Started'
                    : a.status === 'done' ? 'Done'
                    : a.status}
                </Pill>
              </div>
            )) : <div className="text-sm text-gray-500">No upcoming items.</div>}
          </div>
        </Card>

        <Card title="Mentor Notes">
          <div className="space-y-3">
            {selectedChildNotes.length ? selectedChildNotes.map(n => (
              <div key={n.id} className="text-sm">
                <div className="text-gray-500">{fmtDate(n.created_at)}</div>
                <div>{n.body}</div>
              </div>
            )) : <div className="text-sm text-gray-500">No recent notes.</div>}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Vectorius prototype • All data is mocked for demo purposes.
          </div>
        </Card>
      </>
    );
  };

  /* ---------------- Mentor dashboard ---------------- */

  const MentorHome = () => {
    const filtered = rosterQuery
      ? roster.filter(s => (`${s.first_name} ${s.last_name}`).toLowerCase().includes(rosterQuery.toLowerCase()))
      : roster;
    const selected = roster.find(s => s.id === selectedStudentId);

    return (
      <>
        <Card title="Student Roster" right={<span className="text-xs text-gray-500">{roster.length} total</span>}>
          <input
            className="w-full text-sm border rounded px-3 py-2 mb-3"
            placeholder="Search students..."
            value={rosterQuery}
            onChange={(e) => setRosterQuery(e.target.value)}
          />
          <div className="space-y-2">
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left px-3 py-2 rounded border ${
                  selectedStudentId === s.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="font-medium">{s.first_name} {s.last_name}</div>
              </button>
            ))}
            {!filtered.length && <div className="text-sm text-gray-500">No matches.</div>}
          </div>
        </Card>

        <Card title={`Student Summary — ${selected ? `${selected.first_name} ${selected.last_name}` : '—'}`}>
          {!selected && <div className="text-sm text-gray-500">Select a student to view details.</div>}
          {selected && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">Progress</div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>Math</span><span>78%</span></div>
                    <ProgressBar value={78} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>Science</span><span>52%</span></div>
                    <ProgressBar value={52} />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">Recent Notes</div>
                <div className="space-y-3">
                  {selectedStudentNotes.map(n => (
                    <div key={n.id} className="text-sm">
                      <div className="text-gray-500">{fmtDate(n.created_at)}</div>
                      <div>{n.body}</div>
                    </div>
                  ))}
                  {!selectedStudentNotes.length && <div className="text-sm text-gray-500">No notes yet.</div>}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="Add Mentor Note">
          <div className="flex items-start gap-3">
            <textarea
              className="flex-1 text-sm border rounded p-2"
              rows={3}
              placeholder="Note about today’s session..."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <button
              disabled={!noteDraft || !selectedStudentId || !advisorId}
              onClick={async () => {
                try {
                  setNoteStatus('saving');
                  await insertMentorNote({ studentId: selectedStudentId, advisorId, body: noteDraft.trim() });
                  setNoteDraft('');
                  const notes = await fetchRecentNotesForStudent(selectedStudentId, 2);
                  setSelectedStudentNotes(notes);
                  setNoteStatus('saved');
                  setTimeout(() => setNoteStatus(null), 1500);
                } catch (err) {
                  setNoteStatus(`error:${err.message}`);
                }
              }}
              className="px-4 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {noteStatus && (
            <div className="mt-2 text-xs">
              {noteStatus === 'saving' && <span className="text-gray-500">Saving…</span>}
              {noteStatus === 'saved' && <span className="text-emerald-700">Saved.</span>}
              {noteStatus?.startsWith('error:') && <span className="text-red-600">{noteStatus}</span>}
            </div>
          )}
        </Card>
      </>
    );
  };

  return (
    <Container>
      <Topbar
        role={role}
        onChangeRole={setRole}
        envBanner={
          liveAssignments
            ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Live data</span>
            : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">Demo data</span>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
        <Sidebar role={role} current={'home'} onNav={() => {}} />
        <main className="space-y-6">
          {liveError && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Backend read failed: <span className="font-mono">{liveError}</span>. Falling back to demo rows.
            </div>
          )}
          {role === 'Mentor'
            ? <MentorHome />
            : role === 'Parent'
              ? <ParentHome />
              : <StudentLikeHome />
          }
        </main>
      </div>
    </Container>
  );
}
