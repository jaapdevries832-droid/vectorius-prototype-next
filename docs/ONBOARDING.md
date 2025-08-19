# Onboarding

## Prereqs
- Node 18+ (or 20+), npm/pnpm
- Supabase project (URL + anon key)

## Local run
```bash
cd web
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```
Visit http://localhost:3000

## Apply DB changes
1. In Supabase SQL Editor, run files under `/db/migrations/` (timestamped).
2. (Optional) run `/db/seed/` to load sample data.
3. Export a fresh schema dump and place it in `/db/schema/2025-08-18_schema.sql`.

## Conventions
- All frontend data access flows through `/web/lib/api.ts`.
- Any schema change must ship with a migration and an updated schema dump.
- Secrets live in `.env.local` and **never** in Git.
