// web/lib/api.ts
// Live Supabase data access (no RLS/auth). Role-aware helpers.

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

function must<T>(data: T | null, error: any): T {
  if (error) throw error;
  if (!data) throw new Error("No data");
  return data;
}

/** Simple health check used by /debug-supabase */
export async function getHealth(): Promise<string> {
  const { count, error } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return `ok:${count ?? 0}`;
}

/** Any student/parent/advisor IDs (for impersonation without auth) */
export async function getAnyStudentId(): Promise<string> {
  const { data, error } = await supabase.from("students").select("id").limit(1);
  return must(data, error)[0].id;
}
export async function getAnyParentId(): Promise<string> {
  const { data, error } = await supabase.from("parents").select("id").limit(1);
  return must(data, error)[0].id;
}
export async function getAnyAdvisorId(): Promise<string> {
  const { data, error } = await supabase.from("advisors").select("id").limit(1);
  return must(data, error)[0].id;
}

/** Relationships -> student ids */
export async function getStudentIdsForParent(parentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("student_parent")
    .select("student_id")
    .eq("parent_id", parentId);
  return must(data, error).map((r: any) => r.student_id);
}
export async function getStudentIdsForAdvisor(advisorId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("student_advisor")
    .select("student_id")
    .eq("advisor_id", advisorId);
  return must(data, error).map((r: any) => r.student_id);
}

/** Core assignment readers */
export async function listAssignmentsByStudentIds(studentIds: string[], limit = 200): Promise<Assignment[]> {
  if (!studentIds.length) return [];
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .in("student_id", studentIds)
    .order("due_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Assignment[];
}

/** Convenience: next N days (for the plan widget) */
export async function listAssignmentsDueInDays(studentIds: string[], days = 14): Promise<Assignment[]> {
  if (!studentIds.length) return [];
  const now = new Date();
  const to = new Date(Date.now() + days * 86400000);
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .in("student_id", studentIds)
    .gte("due_at", now.toISOString())
    .lte("due_at", to.toISOString())
    .order("due_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Assignment[];
}

/** Role strategy: return the studentIds that correspond to the impersonated role */
export async function resolveStudentIdsForRole(role: "Student" | "Parent" | "Mentor"): Promise<string[]> {
  if (role === "Student") {
    const id = await getAnyStudentId();
    return [id];
  }
  if (role === "Parent") {
    const pid = await getAnyParentId();
    const sids = await getStudentIdsForParent(pid);
    return sids;
  }
  // Mentor
  const aid = await getAnyAdvisorId();
  const sids = await getStudentIdsForAdvisor(aid);
  return sids;
}
