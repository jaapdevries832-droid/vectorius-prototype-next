// web/lib/api.ts
// Centralized Supabase data access
import { supabase } from "./supabaseClient";

export type Assignment = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "blocked" | "archived";
  due_at: string | null;
  student_id: string;
  creator_advisor_id: string | null;
  created_at: string;
};

function throwIf(err: any) {
  if (err) throw err;
}

/** All assignments, newest first */
export async function listAllAssignments(limit = 100): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIf(error);
  return (data ?? []) as Assignment[];
}

/** Assignments due in the next N days (default 7) */
export async function listThisWeeksPlan(days = 7): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .gte("due_at", new Date().toISOString())
    .lte("due_at", new Date(Date.now() + days * 86400000).toISOString())
    .order("due_at", { ascending: true });
  throwIf(error);
  return (data ?? []) as Assignment[];
}

/** Health check used by /debug-supabase */
export async function getHealth(): Promise<string> {
  const { count, error } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true });
  throwIf(error);
  return `ok:${count ?? 0}`;
}
