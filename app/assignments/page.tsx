"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Assignment = {
  id: string;
  student_id: string | null;
  title: string;
  due_date: string | null;
  status: "todo" | "in_progress" | "done";
  created_at: string;
};

type Filter = "all" | "todo" | "in_progress" | "done";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const today = new Date();
  // strip time for clean day math
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function StatusPill({ status }: { status: Assignment["status"] }) {
  const map = {
    todo: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    done: "bg-emerald-100 text-emerald-800",
  } as const;
  const label = status.replace("_", " ");
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label}
    </span>
  );
}

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [studentId, setStudentId] = useState("alex");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Assignment["status"]>("todo");

  // UI filters
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  async function fetchAssignments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setItems((data as Assignment[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.from("assignments").insert({
      student_id: studentId || null,
      title,
      due_date: dueDate || null,
      status,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setDueDate("");
    setStatus("todo");
    fetchAssignments();
  }

  async function toggleStatus(id: string, current: Assignment["status"]) {
    const next = current === "done" ? "todo" : "done";
    const { error } = await supabase.from("assignments").update({ status: next }).eq("id", id);
    if (!error) fetchAssignments();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (!error) fetchAssignments();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((a) => (filter === "all" ? true : a.status === filter))
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          (a.student_id || "").toLowerCase().includes(q)
      )
      // sort: overdue first, then due date asc, then created_at desc
      .sort((a, b) => {
        const da = daysUntil(a.due_date);
        const db = daysUntil(b.due_date);
        const oa = da !== null && da < 0 ? 1 : 0;
        const ob = db !== null && db < 0 ? 1 : 0;
        if (oa !== ob) return ob - oa; // overdue first
        if (da === null && db !== null) return 1;
        if (db === null && da !== null) return -1;
        if (da !== null && db !== null && da !== db) return da - db;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [items, filter, query]);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
          <p className="text-sm text-gray-500">
            Add tasks, track status, and see what&rsquo;s due soon.
          </p>
        </div>

        {/* quick filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "todo", "in_progress", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-sm capitalize ${
                filter === f ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100"
              }`}
              title={`Show ${f.replace("_", " ")}`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
          <input
            className="ml-2 w-44 rounded border px-3 py-1.5 text-sm"
            placeholder="Search title or student…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      {/* add form */}
      <form
        onSubmit={addAssignment}
        className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-5"
      >
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 5 summary"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Student</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="alex"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Due date</label>
          <input
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as Assignment["status"])}
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="md:col-span-5">
          <button className="w-full rounded-xl bg-gray-900 px-4 py-2 text-white hover:bg-black">
            Add
          </button>
        </div>
      </form>

      {/* list */}
      <section className="space-y-3">
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">
            No assignments match your filters.
          </div>
        ) : (
          filtered.map((a) => {
            const d = daysUntil(a.due_date);
            const overdue = d !== null && d < 0;
            const dueSoon = d !== null && d >= 0 && d <= 3; // highlight 3‑day window
            return (
              <div
                key={a.id}
                className={`flex items-start justify-between rounded-2xl border bg-white p-4 shadow-sm ${
                  overdue ? "border-red-300" : dueSoon ? "border-amber-300" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">{a.title}</h3>
                    <StatusPill status={a.status} />
                    {overdue && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Overdue
                      </span>
                    )}
                    {!overdue && dueSoon && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Due soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {(a.student_id ?? "—").toLowerCase()} •{" "}
                    {a.due_date ? new Date(a.due_date).toISOString().slice(0, 10) : "No due date"}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => toggleStatus(a.id, a.status)}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    title={a.status === "done" ? "Mark To-do" : "Mark Done"}
                  >
                    {a.status === "done" ? "Mark To‑do" : "Mark Done"}
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="rounded-lg border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
