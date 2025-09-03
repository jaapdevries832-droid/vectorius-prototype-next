// web/app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./globals.css";
import ProgressBar from "../components/ProgressBar";
import Pill from "../components/Pill";
import Container from "../components/Container";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import Alert from "../components/Alert";
import Dropdown from "../components/Dropdown";
import WeeklyPlanMock from "../components/WeeklyPlanMock";
import HomeworkProjectsMock from "../components/HomeworkProjectsMock";
import ChatMock from "../components/ChatMock";
import {
  resolveStudentIdsForRole,
  listAssignmentsByStudentIds,
  listAssignmentsDueInDays,
  getAnyAdvisorId,
  getAnyParentId,
  getStudentIdsForParent,
} from "../lib/api";
import { supabase } from "../lib/supabaseClient";

/* --------------- Demo fallback --------------- */

const DEMO_PLAN = [
  {
    id: "d1",
    title: "Algebra: Quadratics p.42",
    status: "in_progress",
    due_at: "2025-08-12T00:00:00Z",
  },
  { id: "d2", title: "Science Lab: Density", status: "todo", due_at: "2025-08-20T00:00:00Z" },
  {
    id: "d3",
    title: "English Essay: Hero’s Journey",
    status: "done",
    due_at: "2025-08-22T00:00:00Z",
  },
];

const DEMO_ASSIGNMENTS = [
  {
    id: "a1",
    title: "Algebra: Quadratics p.42",
    status: "in_progress",
    due_at: "2025-08-12T00:00:00Z",
  },
  { id: "a2", title: "Science Lab: Density", status: "todo", due_at: "2025-08-20T00:00:00Z" },
  {
    id: "a3",
    title: "English Essay: Hero’s Journey",
    status: "done",
    due_at: "2025-08-22T00:00:00Z",
  },
];

/* --------------- Helpers --------------- */

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "—");
const statusToIntent = (s: string) => {
  if (s === "done") return "success" as const;
  if (s === "in_progress") return "info" as const;
  if (s === "blocked") return "warning" as const;
  return "neutral" as const;
};

/* --------------- Mentor helpers (to be centralized) --------------- */

async function fetchMentorRoster(advisorId: string) {
  const { data: rels, error: e1 } = await supabase
    .from("student_advisor")
    .select("student_id")
    .eq("advisor_id", advisorId);
  if (e1) throw e1;
  const studentIds = (rels ?? []).map((r: any) => r.student_id);
  if (!studentIds.length) return [] as any[];
  const { data: students, error: e2 } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .in("id", studentIds)
    .order("last_name", { ascending: true });
  if (e2) throw e2;
  return students ?? [];
}

async function fetchRecentNotesForStudent(studentId: string, limit = 2) {
  const { data, error } = await supabase
    .from("notes")
    .select("id, body, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function insertMentorNote({
  studentId,
  advisorId,
  body,
}: {
  studentId: string;
  advisorId: string;
  body: string;
}) {
  const { error } = await supabase.from("notes").insert({
    student_id: studentId,
    author_advisor_id: advisorId,
    body,
    visible_to_student: true,
    visible_to_parents: true,
  });
  if (error) throw error;
}

async function fetchAllStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// UI label "Mentor" maps to DB table `advisors`.
// Everything in the data layer uses advisors + student_advisor.
async function fetchAllAdvisors() {
  // Primary query: list all advisors with names/email
  const { data, error } = await supabase
    .from("advisors")
    .select("id, first_name, last_name, email")
    .order("last_name", { ascending: true });
  if (!error && data && data.length) return data;

  // Fallback: discover advisor ids present via student_advisor (distinct)
  const { data: rels, error: relErr } = await supabase
    .from("student_advisor")
    .select("advisor_id")
    .limit(1000);
  if (relErr || !rels?.length) return [] as any[];
  const uniq = Array.from(new Set(rels.map((r: any) => r.advisor_id)));
  // Try fetching minimal advisor rows (id only is fine for UI fallback)
  const { data: minimal } = await supabase
    .from("advisors")
    .select("id, first_name, last_name, email")
    .in("id", uniq);
  if (minimal?.length) return minimal;
  return uniq.map((id: string) => ({ id, first_name: null, last_name: null, email: null }));
}

async function fetchAllParents() {
  const { data, error } = await supabase
    .from("parents")
    .select("id, first_name, last_name")
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/* --------------- Main ---------------- */

export default function HomePage() {
  const [role, setRole] = useState<"Student" | "Parent" | "Mentor">("Student");
  const [tab, setTab] = useState("home");

  // Common data
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [livePlan, setLivePlan] = useState<any[] | null>(null);
  const [liveAssignments, setLiveAssignments] = useState<any[] | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Parent state
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentChildren, setParentChildren] = useState<any[]>([]); // [{id, first_name,last_name}]
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChildNotes, setSelectedChildNotes] = useState<any[]>([]);

  // Mentor state
  const [advisorId, setAdvisorId] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [rosterQuery, setRosterQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentNotes, setSelectedStudentNotes] = useState<any[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteStatus, setNoteStatus] = useState<string | null>(null);

  // Lists of entities for drop-down selectors
  const [studentList, setStudentList] = useState<any[]>([]);
  // Selected student id when in Student role
  const [studentRoleStudentId, setStudentRoleStudentId] = useState<string | null>(null);
  // List of advisors/teachers available
  const [advisorList, setAdvisorList] = useState<any[]>([]);

  // List of parents and selected parent (for the Parent role)
  const [parentList, setParentList] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Load data when role changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setLiveError(null);

        if (role === "Student") {
          // Load all students for selection
          const students = await fetchAllStudents();
          if (!mounted) return;
          setStudentList(students);
          const firstStudentId = students[0]?.id ?? null;
          setStudentRoleStudentId(firstStudentId);
          if (firstStudentId) {
            const [plan, all] = await Promise.all([
              listAssignmentsDueInDays([firstStudentId], 14),
              listAssignmentsByStudentIds([firstStudentId], 200),
            ]);
            if (!mounted) return;
            setStudentIds([firstStudentId]);
            setLivePlan(plan as any);
            setLiveAssignments(all as any);
          } else {
            setStudentIds([]);
            setLivePlan([]);
            setLiveAssignments([]);
          }
        } else if (role === "Parent") {
          const parents = await fetchAllParents();
          if (!mounted) return;
          setParentList(parents);
          const pid = parents[0]?.id ?? null;
          setSelectedParentId(pid);
          if (pid) {
            const { data: rels, error: relErr } = await supabase
              .from("student_parent")
              .select("student_id")
              .eq("parent_id", pid);
            if (relErr) throw relErr;
            const sids = (rels ?? []).map((r: any) => r.student_id);
            if (!sids.length) {
              setStudentIds([]);
              setLivePlan([]);
              setLiveAssignments([]);
            } else {
              const [plan, all] = await Promise.all([
                listAssignmentsDueInDays(sids, 14),
                listAssignmentsByStudentIds(sids, 200),
              ]);
              if (!mounted) return;
              setStudentIds(sids);
              setLivePlan(plan as any);
              setLiveAssignments(all as any);
            }
          }
        } else {
          // Mentor
          const aid = await getAnyAdvisorId();
          if (!mounted) return;
          setAdvisorId(aid);
          const roster = await fetchMentorRoster(aid);
          if (!mounted) return;
          setRoster(roster);
          const s0 = roster[0]?.id ?? null;
          setSelectedStudentId(s0);
          if (s0) {
            const [notes, plan, all] = await Promise.all([
              fetchRecentNotesForStudent(s0, 2),
              listAssignmentsDueInDays([s0], 14),
              listAssignmentsByStudentIds([s0], 200),
            ]);
            if (!mounted) return;
            setSelectedStudentNotes(notes);
            setStudentIds([s0]);
            setLivePlan(plan as any);
            setLiveAssignments(all as any);
          }
        }
      } catch (e: any) {
        console.error(e);
        setLiveError(e?.message || String(e));
        setStudentIds([]);
        setLivePlan(DEMO_PLAN);
        setLiveAssignments(DEMO_ASSIGNMENTS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [role]);

  // Persist selections across refresh
  useEffect(() => {
    if (role === "Student" && studentRoleStudentId && typeof window !== "undefined") {
      window.localStorage.setItem("v17_student_selected", studentRoleStudentId);
    }
  }, [role, studentRoleStudentId]);
  useEffect(() => {
    if (role === "Parent" && selectedParentId && typeof window !== "undefined") {
      window.localStorage.setItem("v17_parent_selected", selectedParentId);
    }
  }, [role, selectedParentId]);
  useEffect(() => {
    if (role === "Parent" && selectedChildId && typeof window !== "undefined") {
      window.localStorage.setItem("v17_parent_child_selected", selectedChildId);
    }
  }, [role, selectedChildId]);
  useEffect(() => {
    if (role === "Mentor" && advisorId && typeof window !== "undefined") {
      window.localStorage.setItem("v17_advisor_selected", advisorId);
    }
  }, [role, advisorId]);

  // React to student change in Student role
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (role !== "Student") return;
      const sid = studentRoleStudentId;
      try {
        setLoading(true);
        if (sid) {
          const [plan, all] = await Promise.all([
            listAssignmentsDueInDays([sid], 14),
            listAssignmentsByStudentIds([sid], 200),
          ]);
          if (!mounted) return;
          setStudentIds([sid]);
          setLivePlan(plan as any);
          setLiveAssignments(all as any);
        } else {
          setStudentIds([]);
          setLivePlan([]);
          setLiveAssignments([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [role, studentRoleStudentId]);

  // React to parent changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (role !== "Parent") return;
      try {
        setLoading(true);
        const pid = selectedParentId;
        if (pid) {
          const { data: rels, error: relErr } = await supabase
            .from("student_parent")
            .select("student_id")
            .eq("parent_id", pid);
          if (relErr) throw relErr;
          const sids = (rels ?? []).map((r: any) => r.student_id);
          const { data: kids, error: kidsErr } = await supabase
            .from("students")
            .select("id, first_name, last_name")
            .in("id", sids.length ? sids : ["00000000-0000-0000-0000-000000000000"]) // ensure array not empty
            .order("last_name", { ascending: true });
          if (kidsErr) throw kidsErr;
          if (!mounted) return;
          setParentChildren(kids ?? []);
          // Adjust selected child if needed
          const cid =
            selectedChildId && (kids ?? []).some((k: any) => k.id === selectedChildId)
              ? selectedChildId
              : (kids ?? [])[0]?.id || null;
          setSelectedChildId(cid);
          if (cid) {
            const [plan, all, notes] = await Promise.all([
              listAssignmentsDueInDays([cid], 14),
              listAssignmentsByStudentIds([cid], 200),
              fetchRecentNotesForStudent(cid, 10),
            ]);
            if (!mounted) return;
            setStudentIds([cid]);
            setLivePlan(plan as any);
            setLiveAssignments(all as any);
            setSelectedChildNotes(notes);
          } else {
            setStudentIds([]);
            setLivePlan([]);
            setLiveAssignments([]);
            setSelectedChildNotes([]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [role, selectedParentId]);

  // React to child selection
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (role !== "Parent") return;
      const cid = selectedChildId;
      if (!cid) return;
      try {
        const [plan, all, notes] = await Promise.all([
          listAssignmentsDueInDays([cid], 14),
          listAssignmentsByStudentIds([cid], 200),
          fetchRecentNotesForStudent(cid, 10),
        ]);
        if (!mounted) return;
        setStudentIds([cid]);
        setLivePlan(plan as any);
        setLiveAssignments(all as any);
        setSelectedChildNotes(notes);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [role, selectedChildId]);

  // Renderers per role
  const StudentLikeHome = () => {
    const plan = livePlan ?? DEMO_PLAN;
    const items = liveAssignments ?? DEMO_ASSIGNMENTS;
    const progress = useMemo(() => {
      const total = items.length || 1;
      const done = items.filter((a) => a.status === "done").length;
      return Math.round((done / total) * 100);
    }, [liveAssignments]);

    return (
      <>
        <Card title="Student">
          <Dropdown
            label="Select student"
            value={studentRoleStudentId || ""}
            onChange={(v: any) => setStudentRoleStudentId(v)}
            options={studentList}
            getKey={(o: any) => o.id}
            getLabel={(o: any) => `${o.first_name} ${o.last_name}`}
            className=""
          />
        </Card>
        <Card
          title="Progress Overview"
          right={<span className="text-xs text-gray-500">{progress}%</span>}
        >
          <ProgressBar value={progress} />
        </Card>
        <Card title="Weekly Plan (Mock)">
          <WeeklyPlanMock items={[]} />
        </Card>
        <Card title="Upcoming Plan (14d from DB)">
          <div className="space-y-2">
            {plan.map((a) => (
              <div key={a.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{(a as any).title}</div>
                  <div className="text-xs text-gray-500">
                    Due {fmtDate((a as any).dueAt ?? (a as any).due_at)}
                  </div>
                </div>
                <Pill intent={statusToIntent((a as any).status)}>{(a as any).status}</Pill>
              </div>
            ))}
            {!plan.length && <div className="text-sm text-gray-500">No items scheduled.</div>}
          </div>
        </Card>
        <Card title="Homework & Projects (Mock)">
          <HomeworkProjectsMock items={[]} />
        </Card>
        <Card title="AI Chat (Mock)">
          <ChatMock />
        </Card>
      </>
    );
  };

  const ParentHome = () => {
    const items = liveAssignments ?? DEMO_ASSIGNMENTS;
    const progress = useMemo(() => {
      const total = items.length || 1;
      const done = items.filter((a) => a.status === "done").length;
      return Math.round((done / total) * 100);
    }, [liveAssignments]);

    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Parent">
            <Dropdown
              label="Select parent"
              value={selectedParentId || ""}
              onChange={(v: any) => setSelectedParentId(v)}
              options={parentList}
              getKey={(o: any) => o.id}
              getLabel={(o: any) => `${o.first_name} ${o.last_name}`}
              className=""
            />
          </Card>
          <Card title="Child">
            <Dropdown
              label="Select child"
              value={selectedChildId || ""}
              onChange={(v: any) => setSelectedChildId(v)}
              options={parentChildren}
              getKey={(o: any) => o.id}
              getLabel={(o: any) => `${o.first_name} ${o.last_name}`}
              className=""
            />
          </Card>
        </div>

        <Card
          title="Progress Overview"
          right={<span className="text-xs text-gray-500">{progress}%</span>}
        >
          <ProgressBar value={progress} />
        </Card>
        <Card title="Upcoming Deadlines (Mock)">
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>Math quiz on Friday</li>
            <li>Science lab report next Tuesday</li>
            <li>English essay draft in 10 days</li>
          </ul>
        </Card>
        <Card title="Mentor Notes">
          <div className="space-y-3">
            {selectedChildNotes.map((n) => (
              <div key={n.id} className="text-sm">
                <div className="text-gray-500">{fmtDate(n.created_at)}</div>
                <div>{n.body}</div>
              </div>
            ))}
            {!selectedChildNotes.length && (
              <div className="text-sm text-gray-500">
                No notes yet. {/* DB table "notes" exists; reading is wired. */}
              </div>
            )}
          </div>
        </Card>
      </>
    );
  };

  const MentorHome = () => {
    const filtered = roster.filter((s) => {
      const q = rosterQuery.trim().toLowerCase();
      if (!q) return true;
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
    });
    const selected = roster.find((s) => s.id === selectedStudentId);

    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Mentor (Advisor)">
            <Dropdown
              label="Select mentor (advisor)"
              value={advisorId || ""}
              onChange={async (aid: any) => {
                setAdvisorId(aid);
                try {
                  const r = await fetchMentorRoster(aid);
                  setRoster(r);
                  const s0 = r[0]?.id ?? null;
                  setSelectedStudentId(s0);
                  if (s0) {
                    const [notes, plan, all] = await Promise.all([
                      fetchRecentNotesForStudent(s0, 2),
                      listAssignmentsDueInDays([s0], 14),
                      listAssignmentsByStudentIds([s0], 200),
                    ]);
                    setSelectedStudentNotes(notes);
                    setStudentIds([s0]);
                    setLivePlan(plan as any);
                    setLiveAssignments(all as any);
                  } else {
                    setSelectedStudentNotes([]);
                    setStudentIds([]);
                    setLivePlan([]);
                    setLiveAssignments([]);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              options={advisorList}
              getKey={(o: any) => o.id}
              getLabel={(o: any) => {
                const ln = (o?.last_name || "").trim();
                const fn = (o?.first_name || "").trim();
                if (ln || fn) return `${ln}${ln ? ", " : ""}${fn}`;
                if (o?.email) return o.email;
                const sid = String(o?.id || "").slice(0, 8);
                return sid ? `Advisor ${sid}` : "Advisor";
              }}
              className=""
            />
          </Card>
          <Card title="Student">
            <Dropdown
              label="Select student"
              value={selectedStudentId || ""}
              onChange={async (sid: any) => {
                setSelectedStudentId(sid);
                try {
                  const [notes, plan, all] = await Promise.all([
                    fetchRecentNotesForStudent(sid, 2),
                    listAssignmentsDueInDays([sid], 14),
                    listAssignmentsByStudentIds([sid], 200),
                  ]);
                  setSelectedStudentNotes(notes);
                  setStudentIds([sid]);
                  setLivePlan(plan as any);
                  setLiveAssignments(all as any);
                } catch (e) {
                  console.error(e);
                }
              }}
              options={roster}
              getKey={(o: any) => o.id}
              getLabel={(o: any) => `${o.first_name} ${o.last_name}`}
              className=""
            />
          </Card>
        </div>
        <Card
          title="Student Roster"
          right={<span className="text-xs text-gray-500">{roster.length} total</span>}
        >
          <input
            className="w-full text-sm border rounded px-3 py-2 mb-3"
            placeholder="Search students..."
            value={rosterQuery}
            onChange={(e) => setRosterQuery(e.target.value)}
          />
          <div className="space-y-2">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full text-left px-3 py-2 rounded border ${
                  selectedStudentId === s.id
                    ? "bg-indigo-50 border-indigo-200"
                    : "hover:bg-gray-50 border-gray-200"
                }`}
              >
                <div className="font-medium">
                  {s.first_name} {s.last_name}
                </div>
              </button>
            ))}
            {!filtered.length && <div className="text-sm text-gray-500">No matches.</div>}
          </div>
        </Card>

        <Card
          title={`Student Summary — ${selected ? `${selected.first_name} ${selected.last_name}` : "—"}`}
        >
          {!selected && (
            <div className="text-sm text-gray-500">Select a student to view details.</div>
          )}
          {selected && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">Progress</div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Math</span>
                      <span>78%</span>
                    </div>
                    <ProgressBar value={78} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Science</span>
                      <span>52%</span>
                    </div>
                    <ProgressBar value={52} />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">Recent Notes</div>
                <div className="space-y-3">
                  {selectedStudentNotes.map((n) => (
                    <div key={n.id} className="text-sm">
                      <div className="text-gray-500">{fmtDate(n.created_at)}</div>
                      <div>{n.body}</div>
                    </div>
                  ))}
                  {!selectedStudentNotes.length && (
                    <div className="text-sm text-gray-500">No notes yet.</div>
                  )}
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
                  setNoteStatus("saving");
                  await insertMentorNote({
                    studentId: selectedStudentId!,
                    advisorId: advisorId!,
                    body: noteDraft.trim(),
                  });
                  setNoteDraft("");
                  const notes = await fetchRecentNotesForStudent(selectedStudentId!, 2);
                  setSelectedStudentNotes(notes);
                  setNoteStatus("saved");
                  setTimeout(() => setNoteStatus(null), 1500);
                } catch (err: any) {
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
              {noteStatus === "saving" && <span className="text-gray-500">Saving…</span>}
              {noteStatus === "saved" && <span className="text-emerald-700">Saved.</span>}
              {noteStatus?.startsWith("error:") && (
                <span className="text-red-600">{noteStatus}</span>
              )}
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
          liveAssignments ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Live data
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              Demo data
            </span>
          )
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
        <Sidebar role={role} current={"home"} onNav={() => {}} />
        <main className="space-y-6">
          {liveError && (
            <Alert intent="warning">
              Backend read failed: <span className="font-mono">{liveError}</span>. Falling back to
              demo rows.
            </Alert>
          )}
          {role === "Mentor" ? (
            <MentorHome />
          ) : role === "Parent" ? (
            <ParentHome />
          ) : (
            <StudentLikeHome />
          )}
        </main>
      </div>
    </Container>
  );
}
