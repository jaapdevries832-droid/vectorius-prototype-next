begin;

-- Advisors (10)
with a(n) as (select g from generate_series(1,10) g)
insert into public.advisors (id, first_name, last_name, email, specialization, bio, capacity)
select gen_random_uuid(), 'Advisor', n::text, 'advisor'||n||'@example.com',
       'Specialist #'||n, 'Experienced mentor for academic planning.', 12
from a;

-- Parents (30)
with p(n) as (select g from generate_series(1,30) g)
insert into public.parents (id, first_name, last_name, email, phone, kind)
select gen_random_uuid(), 'Parent', n::text, 'parent'||n||'@example.com',
       '555-010'||(n % 10),
       case when (n % 3)=0 then 'guardian'
            when (n % 2)=0 then 'father' else 'mother' end::public.parent_type
from p;

-- Students (30)
with s(n) as (select g from generate_series(1,30) g)
insert into public.students (id, first_name, last_name, email, grade_level, school_name, status)
select gen_random_uuid(), 'Student', n::text, 'student'||n||'@example.com',
       ((n % 7) + 6)::smallint, 'Vectorius Middle/High', 'active'
from s;

-- Link parents ↔ students
with s as (
  select id, row_number() over(order by created_at) rn from public.students
),
p as (
  select id, kind, row_number() over(order by created_at) rn from public.parents
)
insert into public.student_parent (student_id, parent_id, relation)
select s.id, p.id, p.kind
from s join p on (s.rn between 1 and 10 and p.rn in (s.rn*2-1, s.rn*2))
union all
select s.id, p.id, p.kind
from s join p on (s.rn between 11 and 20 and p.rn = s.rn)
union all
select s.id, p.id, p.kind
from s join p on (s.rn between 21 and 30 and p.rn in (29,30));

-- Link advisors ↔ students
with s as (
  select id, row_number() over(order by created_at) rn from public.students
),
a as (
  select id, row_number() over(order by created_at) rn from public.advisors
)
insert into public.student_advisor (student_id, advisor_id, is_primary, start_date)
select s.id, a.id, true, current_date - ((s.rn%60))::int
from s join a on a.rn = ((s.rn - 1) % 10) + 1
union all
select s.id, a.id, false, current_date - ((s.rn%60))::int
from s join a on a.rn = ((s.rn + 3) % 10) + 1
where (s.rn % 2) = 0;

-- Assignments: 3 per student
with s as (select id, row_number() over(order by created_at) rn from public.students),
prim as (select sa.student_id, sa.advisor_id from public.student_advisor sa where sa.is_primary = true)
insert into public.assignments (student_id, creator_advisor_id, title, description, due_at, status)
select s.id, prim.advisor_id,
       'Assignment '||g||' for Student #'||s.rn,
       'Complete task #'||g||' and submit via the portal.',
       now() + (g||' days')::interval,
       (array['todo','in_progress','done'])[g]::public.assignment_status
from s
join prim on prim.student_id = s.id,
generate_series(1,3) g;

-- Notes: 2 per student
with s as (select id from public.students),
prim as (select sa.student_id, sa.advisor_id from public.student_advisor sa where sa.is_primary = true)
insert into public.notes (student_id, author_advisor_id, body, visible_to_student, visible_to_parents, created_at)
select s.id, prim.advisor_id, 'Great progress on recent assignments; keep up the momentum.',
       true, true, now() - interval '2 days'
from s join prim on prim.student_id = s.id
union all
select s.id, prim.advisor_id, 'Private coaching note: focus on time management.',
       false, false, now() - interval '1 day'
from s join prim on prim.student_id = s.id;

commit;

-- sanity
select 'students' tbl, count(*) from public.students union all
select 'advisors' , count(*) from public.advisors union all
select 'parents'  , count(*) from public.parents  union all
select 'assignments', count(*) from public.assignments union all
select 'notes' , count(*) from public.notes;
