begin;

-- Drop all policies on app tables
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname='public'
      and tablename in ('students','advisors','parents','student_parent','student_advisor','assignments','notes')
  loop
    execute format('drop policy if exists "%s" on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Disable RLS (safety)
alter table if exists public.students disable row level security;
alter table if exists public.advisors disable row level security;
alter table if exists public.parents  disable row level security;
alter table if exists public.student_parent disable row level security;
alter table if exists public.student_advisor disable row level security;
alter table if exists public.assignments disable row level security;
alter table if exists public.notes disable row level security;

-- Drop triggers/functions
drop trigger if exists trg_students_touch    on public.students;
drop trigger if exists trg_advisors_touch    on public.advisors;
drop trigger if exists trg_parents_touch     on public.parents;
drop trigger if exists trg_assignments_touch on public.assignments;
drop trigger if exists trg_assignments_guard_student_cols on public.assignments;

drop function if exists public.touch_updated_at() cascade;
drop function if exists public.assignments_guard_only_status_for_students() cascade;

-- Drop tables (dependency order)
drop table if exists public.notes cascade;
drop table if exists public.assignments cascade;
drop table if exists public.student_advisor cascade;
drop table if exists public.student_parent cascade;
drop table if exists public.parents cascade;
drop table if exists public.advisors cascade;
drop table if exists public.students cascade;

-- Drop types
drop type if exists public.assignment_status cascade;
drop type if exists public.parent_type cascade;

commit;
