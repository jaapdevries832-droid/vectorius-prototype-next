# Vectorius Prototype

Vectorius is an education‑oriented platform that brings students, parents and mentors together.  This prototype combines a **Next.js** frontend with a **Supabase** backend to deliver role‑aware dashboards, a normalized database schema and repeatable operational tooling.  It grew out of a series of lessons aimed at turning a messy single‑folder app into a clean, maintainable mono‑repo.  The goal is to provide a strong foundation for building and iterating on a real product while documenting the journey along the way.

## Features

* **Role‑aware dashboards** – Students see their upcoming homework and progress; parents can switch between children and view notes and deadlines; mentors manage their roster and author notes.  All pages consume live data from Supabase.
* **Normalized database schema** – A Postgres schema in `/db/migrations` defines tables such as `students`, `parents`, `advisors`, `assignments` and `notes`.  Seed scripts in `/db/seed` populate 30 students, parents and advisors with realistic relationships and work data for rapid prototyping.
* **Supabase integration** – The frontend uses a typed Supabase client defined in `web/lib/api.ts` to query the database.  A `/debug-supabase` route can be used during development to verify connectivity and row counts.
* **Automation scripts** – Repeatable Git workflows live in `ops/scripts`.  The `sync-branch.sh` script mirrors a remote branch locally so you always start from a clean state, while `finish-branch.sh` commits, pushes, merges into `main` and cleans up feature branches.  See [`docs/ops/scripts/README‑SCRIPS.md`](docs/ops/scripts/README-SCRIPS.md) for usage.
* **Structured repository** – The project is split into logical sections: `/web` for the Next.js app, `/db` for database assets, `/docs` for onboarding and lesson notes, and `/ops` for operational tooling.

## Repository structure

Below is a high‑level overview of the important directories and what they contain:

```
.
├── web/               # Next.js frontend (app/, components/, lib/, configs)
│   └── …              # Pages, API routes and UI components live here
├── db/                # Database related files
│   ├── migrations/    # SQL migrations to create and alter your schema
│   ├── seed/          # SQL scripts to insert sample data
│   └── schema.sql     # Optionally exported schema snapshot
├── docs/              # Documentation and lesson recaps
│   └── ops/scripts/   # README‑SCRIPS.md describing the Git automation
├── ops/               # Operational tooling
│   └── scripts/       # Shell scripts to automate common Git workflows
├── .env.example       # Template for environment variables (copy to .env.local)
├── package.json       # Project metadata and npm scripts
└── README.md          # You are here
```

## Getting started

### Prerequisites

* **Node.js** – Version 18 or later is recommended.
* **npm** – Comes with Node.js.
* **Supabase project** – You’ll need a Supabase instance to supply a database URL and anon/public keys.  You can sign up for free at [supabase.com](https://supabase.com/).
* **git** – Required for the automation scripts.

### Set up your environment

1. Clone this repository and navigate into it.
2. Copy the example environment file and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.local
   # Edit .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. Install dependencies for the frontend:

   ```bash
   cd web
   npm install
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).  You can log in with any email/password created through Supabase Auth or browse as an anonymous user depending on your schema policies.

### Database migrations and seed data

The `db/migrations` folder contains plain SQL files that define your database schema.  To apply them against your Supabase database (or a local Postgres instance), run them in order using `psql`:

```bash
psql "$SUPABASE_DATABASE_URL" -f db/migrations/2025-08-18_Lesson-7.sql
# Additional migration files should be applied in chronological order.
```

Seed data scripts live under `db/seed`.  Running a seed script will insert sample students, parents, advisors, assignments and notes:

```bash
psql "$SUPABASE_DATABASE_URL" -f db/seed/2025-08-18_Lesson-7.sql
```

During prototyping you may choose to run without row‑level security (RLS) or auth enabled.  Subsequent lessons reintroduced RLS once the core flows were proven.

## Git workflow automation

Working on features is simplified by the scripts in `ops/scripts`.  They eliminate the tedium of manually checking out branches, resetting state and performing merges:

* **Start a feature** – Mirror a remote branch locally so you always start from a clean slate:

  ```bash
  ./ops/scripts/sync-branch.sh Lesson-9
  ```

* **Finish a feature** – Stage your changes, commit them, push the branch, merge into `main` with `--no-ff`, push `main` and clean up:

  ```bash
  ./ops/scripts/finish-branch.sh Lesson-9 "feat: introduce dashboards and cleanup"
  ```

For detailed explanations of what each script does and troubleshooting tips, see the [scripts README](docs/ops/scripts/README-SCRIPS.md).

## Contributing

We welcome improvements and new features!  To contribute:

1. Create a new branch for your change and synchronize it with the remote using `sync-branch.sh`.
2. Develop your feature in `/web`, adjust migrations/seed files in `/db` as needed, and update documentation in `/docs`.
3. Ensure that `npm run dev` still works and that migrations apply cleanly on a fresh database.
4. Commit your changes with a descriptive message and finish your branch using `finish-branch.sh`.
5. Push your branch and open a pull request for code review.

Please keep your changes focused and include tests or seed data when appropriate.  If you’re adding a new script or major feature, update the appropriate READMEs so future contributors understand how it works.

## Acknowledgements

This project draws inspiration from the Supabase and Next.js ecosystems, and is the result of multiple learning sessions documented in the `/docs` folder.  Special thanks to everyone who contributed to the early lessons that shaped the architecture and workflow.
