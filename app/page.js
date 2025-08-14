// 'use client' directive allows hooks and interactive code in Next.js app router
'use client';

import React, { useState, useMemo } from 'react';
import './globals.css';

// --- UI utility components ---

// Page wrapper with a light background and default text colour
const Container = ({ children }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>
);

// Topbar with role switcher; passes the selected role back up via callback
const Topbar = ({ role, onChangeRole }) => (
  <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
    <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Logo placeholder */}
        <div className="w-9 h-9 rounded-2xl bg-indigo-600" />
        <span className="font-semibold tracking-tight">Vectorius Prototype</span>
        <span className="ml-3 text-xs px-2 py-1 rounded-full bg-gray-100 border">Demo</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label className="mr-2 font-medium">Impersonate role:</label>
        <select
          className="border rounded-lg px-2 py-1 bg-white"
          value={role}
          onChange={(e) => onChangeRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="mentor">Mentor</option>
        </select>
      </div>
    </div>
  </header>
);

// Sidebar navigation that adapts to role; highlights current tab
const Sidebar = ({ role, nav, current, onNav }) => (
  <aside className="hidden md:block w-64 border-r border-gray-200 bg-white">
    <nav className="p-4 space-y-1">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{role} dashboard</div>
      {nav.map((item) => (
        <button
          key={item.key}
          onClick={() => onNav(item.key)}
          className={`w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 transition ${
            current === item.key ? 'bg-gray-100 font-medium' : ''
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  </aside>
);

// Card wrapper with optional header right component
const Card = ({ title, children, right }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
    <div className="px-4 py-3 border-b flex items-center justify-between">
      <h3 className="font-semibold">{title}</h3>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// Pill style labels used for statuses and tags; different colours by intent
const Pill = ({ children, intent = 'default' }) => {
  const styles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-indigo-100 text-indigo-700',
  }[intent];
  return <span className={`text-xs px-2 py-1 rounded-full ${styles}`}>{children}</span>;
};

// Simple horizontal progress bar used in progress displays
const ProgressBar = ({ value }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full bg-blue-600"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

// --- Seeded demo data according to shared data model ---
const seed = {
  parents: [
    {
      id: 'par01',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      students: ['stu01', 'stu02'],
    },
  ],
  students: [
    {
      id: 'stu01',
      name: 'Alex Johnson',
      parentId: 'par01',
      mentorId: 'men01',
      assignments: ['ass01', 'ass02', 'ass03'],
      progress: ['prog01', 'prog02'],
      notes: ['note01', 'note03'],
    },
    {
      id: 'stu02',
      name: 'Maya Johnson',
      parentId: 'par01',
      mentorId: 'men01',
      assignments: ['ass04'],
      progress: ['prog03'],
      notes: ['note04'],
    },
  ],
  mentors: [
    {
      id: 'men01',
      name: 'Mr. Smith',
      email: 'smith@example.com',
      students: ['stu01', 'stu02'],
    },
  ],
  assignments: [
    {
      id: 'ass01',
      studentId: 'stu01',
      title: 'Algebra: Quadratics p.42',
      dueDate: '2025-08-12',
      status: 'In Progress',
      subject: 'Math',
    },
    {
      id: 'ass05',
      studentId: 'stu01',
      title: 'Test Assignment from Jaap',
      dueDate: '2025-08-11',
      status: 'In Progress',
      subject: 'Math',
    },
    {
      id: 'ass02',
      studentId: 'stu01',
      title: 'Science Lab: Density',
      dueDate: '2025-08-20',
      status: 'Not Started',
      subject: 'Science',
    },
    {
      id: 'ass03',
      studentId: 'stu01',
      title: 'English Essay: Hero’s Journey',
      dueDate: '2025-08-22',
      status: 'Done',
      subject: 'English',
    },
    {
      id: 'ass04',
      studentId: 'stu02',
      title: 'Geometry: Similar Triangles',
      dueDate: '2025-08-19',
      status: 'Not Started',
      subject: 'Math',
    },
  ],
  progressRecords: [
    { id: 'prog01', studentId: 'stu01', subject: 'Math', percentage: 78 },
    { id: 'prog02', studentId: 'stu01', subject: 'Science', percentage: 52 },
    { id: 'prog03', studentId: 'stu02', subject: 'Math', percentage: 88 },
  ],
  mentorNotes: [
    {
      id: 'note01',
      studentId: 'stu01',
      mentorId: 'men01',
      date: '2025-08-10',
      content: 'Doing well in algebra; needs more time in science labs.',
    },
    {
      id: 'note03',
      studentId: 'stu01',
      mentorId: 'men01',
      date: '2025-08-12',
      content: 'Encouraged to review lab safety notes; schedule a practice demo.',
    },
    {
      id: 'note04',
      studentId: 'stu02',
      mentorId: 'men01',
      date: '2025-08-11',
      content: 'Great progress; introduce challenge problems next week.',
    },
  ],
};

// Helper hook to index the data by ID for fast lookup
function useIndex(db) {
  return useMemo(() => {
    const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
    return {
      parents: byId(db.parents),
      students: byId(db.students),
      mentors: byId(db.mentors),
      assignments: byId(db.assignments),
      progressRecords: byId(db.progressRecords),
      mentorNotes: byId(db.mentorNotes),
    };
  }, [db]);
}

// --- Student views ---

// Student dashboard combining weekly planner, assignments table, progress overview and AI help
function StudentHome({ student, db }) {
  const assignments = student.assignments.map((id) => db.assignments[id]);
  // Sort assignments by due date for upcoming tasks
  const upcoming = [...assignments]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const progress = student.progress.map((id) => db.progressRecords[id]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card title="This Week's Plan (Live Demo)" right={<Pill intent="info">Demo Data</Pill>}>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-500">
                    {a.subject} • Due {a.dueDate}
                  </div>
                </div>
                <Pill
                  intent={
                    a.status === 'Done'
                      ? 'success'
                      : a.status === 'Not Started'
                      ? 'warn'
                      : 'info'
                  }
                >
                  {a.status}
                </Pill>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Homework & Projects">
          <AssignmentTable rows={assignments} />
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Your Progress">
          <div className="space-y-4">
            {progress.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{p.subject}</span>
                  <span className="text-sm font-medium">{p.percentage}%</span>
                </div>
                <ProgressBar value={p.percentage} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Ask AI (Mock)">
          <MockAIHelp student={student} db={db} />
        </Card>
      </div>
    </div>
  );
}

// Table listing assignments with filter by status
function AssignmentTable({ rows }) {
  const [filter, setFilter] = useState('');
  const filtered = rows.filter((r) => !filter || r.status === filter);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-gray-600">Filter:</span>
        <select
          className="border rounded-lg px-2 py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All</option>
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Subject</th>
              <th className="py-2 pr-3">Due</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2 pr-3">{a.title}</td>
                <td className="py-2 pr-3">{a.subject}</td>
                <td className="py-2 pr-3">{a.dueDate}</td>
                <td className="py-2">
                  <Pill
                    intent={
                      a.status === 'Done'
                        ? 'success'
                        : a.status === 'Not Started'
                        ? 'warn'
                        : 'info'
                    }
                  >
                    {a.status}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple mocked AI help panel; stores conversation in local component state
function MockAIHelp({ student, db }) {
  const [q, setQ] = useState('');
  const [log, setLog] = useState([
    { role: 'assistant', text: "Hi! I’m your study buddy. Ask me about any assignment." },
  ]);
  function ask() {
    if (!q.trim()) return;
    const firstAssignment = db.assignments[student.assignments[0]];
    const hint =
      'Here’s a nudge: break the task into 3 tiny steps and start with step 1 in 5 minutes.';
    const next = [
      ...log,
      { role: 'user', text: q.trim() },
      {
        role: 'assistant',
        text: `I see ${student.name} has ${firstAssignment.title}. ${hint}`,
      },
    ];
    setLog(next);
    setQ('');
  }
  return (
    <div>
      <div className="h-40 overflow-y-auto space-y-2 mb-3">
        {log.map((m, i) => (
          <div
            key={i}
            className={m.role === 'assistant' ? 'text-indigo-700' : 'text-gray-800'}
          >
            <span className="text-xs uppercase mr-2 opacity-60">{m.role}</span>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Ask about an assignment…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
        />
        <button
          onClick={ask}
          className="px-3 py-2 rounded-lg bg-indigo-600 text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// --- Parent views ---

function ParentHome({ parent, db }) {
  const [currentStudentId, setCurrentStudentId] = useState(parent.students[0]);
  const student = db.students[currentStudentId];
  const assignments = student.assignments.map((id) => db.assignments[id]);
  // Show only assignments that are not done
  const upcoming = [...assignments]
    .filter((a) => a.status !== 'Done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const notes = student.notes
    .map((id) => db.mentorNotes[id])
    .sort((a, b) => b.date.localeCompare(a.date));
  const progress = student.progress.map((id) => db.progressRecords[id]);
  return (
    <div className="space-y-4">
      <Card
        title="Student Selector"
        right={
          <select
            className="border rounded-lg px-2 py-1"
            value={currentStudentId}
            onChange={(e) => setCurrentStudentId(e.target.value)}
          >
            {parent.students.map((sid) => (
              <option value={sid} key={sid}>
                {db.students[sid].name}
              </option>
            ))}
          </select>
        }
      >
        <div className="text-sm text-gray-600">
          Viewing data for <span className="font-medium">{student.name}</span>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Progress Overview">
          <div className="space-y-4">
            {progress.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{p.subject}</span>
                  <span className="text-sm font-medium">{p.percentage}%</span>
                </div>
                <ProgressBar value={p.percentage} />
              </div>
            ))}
          </div>
        </Card>
        <Card
          title="Upcoming Deadlines"
          right={<Pill intent="info">Next 7–10 days</Pill>}
        >
          <ul className="space-y-2">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{a.title}</div>
                  <div className="text-xs text-gray-500">
                    {a.subject} • Due {a.dueDate}
                  </div>
                </div>
                <Pill intent={a.status === 'Not Started' ? 'warn' : 'info'}>
                  {a.status}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Mentor Notes">
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id}>
                <div className="text-xs text-gray-500 mb-1">{n.date}</div>
                <div className="text-sm">{n.content}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Mentor views ---

function MentorHome({ mentor, db }) {
  const [query, setQuery] = useState('');
  const students = mentor.students.map((id) => db.students[id]);
  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );
  const [activeId, setActiveId] = useState(
    filtered[0]?.id || students[0]?.id
  );
  const active = db.students[activeId];
  const [noteDraft, setNoteDraft] = useState('');
  function addNote() {
    if (!noteDraft.trim()) return;
    const newId = `note${Math.floor(Math.random() * 100000)}`;
    // Create new note; update db in-place for demo; in real app this would trigger API
    db.mentorNotes[newId] = {
      id: newId,
      studentId: active.id,
      mentorId: mentor.id,
      date: new Date().toISOString().slice(0, 10),
      content: noteDraft.trim(),
    };
    // Prepend new note ID to student's note list
    active.notes = [newId, ...active.notes];
    setNoteDraft('');
  }
  const progress = active.progress.map((id) => db.progressRecords[id]);
  const notes = active.notes
    .map((id) => db.mentorNotes[id])
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <Card title="Student Roster" right={<Pill>{filtered.length} total</Pill>}>
          <input
            className="w-full border rounded-lg px-3 py-2 mb-3"
            placeholder="Search students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left px-3 py-2 rounded-xl border ${
                  activeId === s.id
                    ? 'bg-gray-50 border-gray-300'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-gray-500">
                  {db.parents[s.parentId].name}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <Card title={`Student Summary — ${active.name}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Progress</div>
              <div className="space-y-3">
                {progress.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{p.subject}</span>
                      <span className="text-sm font-medium">{p.percentage}%</span>
                    </div>
                    <ProgressBar value={p.percentage} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Recent Notes</div>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {notes.map((n) => (
                  <div key={n.id}>
                    <div className="text-xs text-gray-500 mb-1">{n.date}</div>
                    <div className="text-sm">{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card title="Add Mentor Note">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Note about today’s session…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white"
              onClick={addNote}
            >
              Save
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Root component for page ---
export default function Page() {
  // Copy seed into mutable state so adding notes does not mutate the original seed across page refreshes
  const [db] = useState(() => JSON.parse(JSON.stringify(seed)));
  const index = useIndex(db);
  const [role, setRole] = useState('student');
  const [tab, setTab] = useState('home');
  // Define nav items by role; we only use 'home' for now but allow additional pages later
  const navByRole = {
    student: [
      { key: 'home', label: 'Home' },
      { key: 'assignments', label: 'Assignments' },
      { key: 'settings', label: 'Settings' },
    ],
    parent: [
      { key: 'home', label: 'Home' },
      { key: 'progress', label: 'Progress' },
      { key: 'deadlines', label: 'Deadlines' },
      { key: 'notes', label: 'Mentor Notes' },
    ],
    mentor: [
      { key: 'home', label: 'Home' },
    ],
  };
  // Demo identities
  const student = index.students['stu01'];
  const parent = index.parents['par01'];
  const mentor = index.mentors['men01'];
  return (
    <Container>
      <Topbar
        role={role}
        onChangeRole={(r) => {
          setRole(r);
          setTab('home');
        }}
      />
      <div className="mx-auto max-w-7xl flex">
        <Sidebar
          role={role}
          nav={navByRole[role]}
          current={tab}
          onNav={setTab}
        />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          {role === 'student' && <StudentHome student={student} db={index} />}
          {role === 'parent' && <ParentHome parent={parent} db={index} />}
          {role === 'mentor' && <MentorHome mentor={mentor} db={index} />}
          <footer className="pt-8 text-xs text-gray-500">
            Vectorius prototype • All data is mocked for demo purposes.
          </footer>
        </main>
      </div>
    </Container>
  );
}