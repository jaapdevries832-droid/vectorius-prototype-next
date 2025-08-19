begin;
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.parent_type as enum ('mother','father','guardian','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_status as enum ('todo','in_progress','done','blocked','archived');
exception when duplicate_object then null; end $$;

-- Core tables (no user_id / auth FKs)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  email       text unique not null check (position('@' in email) > 1),
  grade_level smallint check (grade_level between 1 and 12),
  school_name text,
  status      text default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  email       text unique not null,
  specialization text,
  bio text,
  capacity smallint default 10,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  email       text unique not null,
  phone text,
  kind public.parent_type not null default 'guardian',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Joins
create table if not exists public.student_parent (
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id  uuid not null references public.parents(id) on delete cascade,
  relation   public.parent_type,
  created_at timestamptz not null default now(),
  primary key (student_id, parent_id)
);

create table if not exists public.student_advisor (
  student_id uuid not null references public.students(id) on delete cascade,
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  is_primary boolean not null default false,
  start_date date default current_date,
  end_date date,
  primary key (student_id, advisor_id)
);

-- Work items
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  creator_advisor_id uuid references public.advisors(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  status public.assignment_status not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_assignments_student on public.assignments(student_id);
create index if not exists idx_assignments_status on public.assignments(status);
create index if not exists idx_assignments_due on public.assignments(due_at);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  author_advisor_id uuid references public.advisors(id) on delete set null,
  author_parent_id  uuid references public.parents(id) on delete set null,
  body text not null,
  visible_to_student boolean not null default true,
  visible_to_parents boolean not null default true,
  created_at timestamptz not null default now()
);

-- Touch-updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_students_touch on public.students;
create trigger trg_students_touch before update on public.students for each row execute function public.touch_updated_at();
drop trigger if exists trg_advisors_touch on public.advisors;
create trigger trg_advisors_touch before update on public.advisors for each row execute function public.touch_updated_at();
drop trigger if exists trg_parents_touch on public.parents;
create trigger trg_parents_touch before update on public.parents for each row execute function public.touch_updated_at();
drop trigger if exists trg_assignments_touch on public.assignments;
create trigger trg_assignments_touch before update on public.assignments for each row execute function public.touch_updated_at();

-- Grants for dev: anon/authenticated can read/write
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

commit;
