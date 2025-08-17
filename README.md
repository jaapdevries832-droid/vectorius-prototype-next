# Vectorius — Role-Based Dashboard Prototype

Vectorius is a role-based dashboard for students, mentors, and parents.  
Built with **Next.js (React framework)** and **Tailwind CSS (utility-first styling)**, deployed on **Vercel (hosting platform)**.  
Backend powered by **Supabase (hosted PostgreSQL database + Authentication + Row-Level Security)**.

---

## Roles
- **Student** — view assignments, weekly planner, progress.  
- **Parent** — see student progress, deadlines, mentor notes.  
- **Mentor** — manage roster, add notes, track student progress.

---

## Architecture
- **Front end:** Next.js (App Router) + React components.  
- **Styling:** Tailwind CSS.  
- **Backend services:** Supabase (PostgreSQL database + Auth + Row-Level Security).  
- **Hosting:** Vercel (preview + production).

---

## External Links
- **Production / Preview:** [vectorius-prototype-next.vercel.app](https://vectorius-prototype-next.vercel.app)  
- **Supabase Project:** [supabase](https://supabase.com/dashboard/project/jpudkwktnpmsssrtsyki)
- **Schema Diagram:** _(add dbdiagram.io or other link)_  
- **Docs / Boards:**
   - [google drive](https://drive.google.com/drive/folders/12vx4f6zABABGmfRcxfRFzpR9N6wtLg3X?usp=drive_link)
   - [Trello](https://trello.com/invite/b/68a0a4dbb2d4b18ec8573648/ATTI8e99413098428cc9936092e453bdef05EEFC62E3/vectorius-90-day-plan)
- **Design:** _(Figma link if any)_

---

## Code Map
```
/app
  layout.(ts|js)      # App shell
  page.(ts|js)        # Landing/dashboard
/components           # Reusable UI
/lib
  supabaseClient.ts   # Supabase client init (added in Lesson 4)
/public               # Static assets
tailwind.config.js    # Tailwind setup
postcss.config.mjs    # PostCSS pipeline
```

---

## Getting Started (Local)
**Requirements:** Node.js 18+ and npm or pnpm.

1. Install:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run:
   ```bash
   npm run dev
   # visit http://localhost:3000
   ```

---

## Database Setup (Supabase)
Tables to create:
- `profiles` (user info + role)  
- `mentors` / `students`  
- `mentor_students` (link table)  
- `assignments`  
- `comments`

Row-Level Security (RLS) policies:  
- Users access their own profile.  
- Mentors manage linked students, assignments, comments.  
- Students see only their own assignments and comments.  

Full SQL + policies are in `/supabase/migrations/`.

---

## Branching & Pull Requests
Create feature branches (e.g., `feat/supabase-integration`).  
Open a Draft Pull Request early.  
Checklist:  
- README updated  
- Env vars documented  
- SQL migrations present  
- New features tested  
- Lint/type checks pass

---

## Glossary
- **RLS (Row-Level Security):** database feature limiting row visibility per user.  
- **PR (Pull Request):** proposed code changes merged into main branch.  
- **CI/CD (Continuous Integration / Continuous Delivery):** automated build/test/deploy pipeline.

---

## Common Gotchas
- After magic-link login, ensure redirect URL matches your deployed domain.  
- Protect server actions that write to the database.  
- Never expose `SERVICE_ROLE_KEY` in the browser.
