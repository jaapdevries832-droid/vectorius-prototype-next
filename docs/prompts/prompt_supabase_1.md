You are tasked with creating a fully functional Supabase backend for the Vectorius app.  
The main app entry point is located at: `web/app/page.js`.  
Update and rewrite the Vectorius codebase as needed so it integrates seamlessly with the new backend.  

### Deliverables

1. **Database Migration Script**
   - Create a new migration file at: `/db/migrations/2025-08-18_Lesson-7.sql`.
   - This script must include:
     - **DDL:** create normalized tables for `students`, `advisors`, `parents`, plus join tables such as `student_parent`, `student_advisor`, and any supporting tables (`assignments`, `notes`, etc.) to capture relationships and data.
     - **Columns:** include rich fields like `name`, `email`, `created_at`, and role-specific attributes (e.g., grades for students, specialization for advisors).
     - **RLS:** enable Row-Level Security and create policies so users can only access rows relevant to their role.
     - **Auth:** integrate with Supabase Auth (students, parents, and advisors must authenticate with email/password or another supported provider).
     - **Grants & Indexes:** add indexes and grants for performance and secure role-based access.
   - Migration scripts must be **separate** from seed scripts.

2. **Seed Data**
   - Create a new seed file at: `/db/seed/2025-08-18_Lesson-7.sql`.
   - Populate with realistic mock data:
     - 30 students (with names, emails, grades, etc.)
     - 10 advisors (with names, emails, specializations, etc.)
     - 30 parents (mix of mothers, fathers, and families with both)
     - Assign children to parents (some parents share children).
     - Assign advisors to students (one or more per student).
     - Add sample assignments and notes to reflect real-world interactions.
   - Ensure relationships are coherent and useful for demo/testing.

3. **Packaging**
   - Bundle the updated codebase and database scripts into a **zip archive**.  
   - The archive should be structured so it can be unzipped directly into the local branch with no manual adjustments.

4. **Instructions**
   - Provide clear, step-by-step instructions written for execution via the **Supabase SQL editor** (not CLI).  
   - Instructions should cover:
     1. Deleting the old Supabase database.
     2. Running the migration script to create the new schema.
     3. Running the seed script to populate mock data.
     4. Verifying that the app at `web/app/page.js` connects and works with the new backend.

---

### Key Notes
- Schema must be normalized with join tables where many-to-many relationships exist.  
- Include Supabase Auth integration + RLS policies for students, parents, and advisors.  
- Seed data must include rich feature sets (names, emails, attributes, relationships, assignments, notes).  
- Instructions should be copy-paste ready into the Supabase SQL editor.  