# ClassTrack

A lightweight classroom submission tracker for teachers: create classrooms,
roster students, add assignment columns, tick off who submitted what, and see
progress per student and per class.

## What it does

- **Classrooms** — teachers create/edit/delete classrooms.
- **Roster** — add students; each gets an auto-numbered row (No. 1, 2, 3…).
- **Assignment columns** — add any number of columns (e.g. "Homework 1"),
  check/uncheck per student, and each student's progress % updates live.
- **Dashboard** — total classrooms, students, assignments, and an overall
  submit / not-submitted rate across everything a teacher owns; each
  classroom card shows its own submit rate too.
- **Edit anything** — classroom details and student info (name/email) are
  editable at any time from the classroom's "Manage classroom" page.
- **Role-based access (RBAC)**:
  - **Teacher** = admin. Full read/write on their own classrooms only.
  - **Student** = read-only member. Can only see their own classroom, with
    their own row highlighted, and cannot change anything.
  - Every mutation is re-checked server-side (`lib/guard.ts`), not just
    hidden in the UI — a student can't edit anything even by calling the
    underlying functions directly.

## How login works

- **Teachers** sign up with email + password (bcrypt-hashed, never stored in
  plain text) and sign in normally at `/login`.
- **Students never create an account or set a password.** When a teacher
  adds a student, ClassTrack generates a private, unguessable link
  (`/s/<token>`). The teacher copies that link (from the classroom's
  "Manage classroom" page) and sends it to the student — email, chat,
  wherever. Opening the link signs the student in as themselves, instantly.
  - Teachers can **regenerate** a student's link at any time (e.g. if it
    leaked), which invalidates the old one.
  - For shared/lab computers, a teacher can optionally set a short **PIN**
    per student, required in addition to the link.

This avoids the two usual pain points: students don't need to manage
passwords, and teachers don't need to run an email/SMTP server just to send
magic links — a copy-paste link works everywhere.

## Tech stack

- **Next.js 15** (App Router, Server Actions, TypeScript)
- **PostgreSQL** via **Prisma ORM**
- **NextAuth.js (Auth.js) v4** — credentials-based, JWT sessions
- **Tailwind CSS** for styling
- **Zod** for input validation, **bcryptjs** for password/PIN hashing

## Getting a Postgres database (easiest options)

You don't need to install Postgres locally. Either works and both have free
tiers:

- **[Neon](https://neon.tech)** — create a project, copy the connection
  string it gives you (already includes `?sslmode=require`).
- **[Supabase](https://supabase.com)** — create a project → Settings →
  Database → copy the "Connection string" (URI, use the pooled one for
  serverless deploys).

## Local setup

```bash
npm install
cp .env.example .env
# edit .env: paste your DATABASE_URL, and set NEXTAUTH_SECRET
# generate a secret with: openssl rand -base64 32

npx prisma db push      # creates all tables from prisma/schema.prisma
npm run db:seed         # optional: adds a demo teacher + classroom

npm run dev
```

Open http://localhost:3000.

If you ran the seed script: sign in at `/login` with
`teacher@example.com` / `password123`, then check the terminal output for
the demo students' private links.

## Deploying

The easiest path: push this to GitHub, import it into
[Vercel](https://vercel.com), and add the same two environment variables
(`DATABASE_URL`, `NEXTAUTH_SECRET`) plus `NEXTAUTH_URL` set to your deployed
URL (e.g. `https://your-app.vercel.app`). Vercel runs `npm run build`, which
also runs `prisma generate` automatically via the `postinstall` script.

After the first deploy, run `npx prisma db push` once (locally, pointed at
the production `DATABASE_URL`) to create the tables in your production
database.

## Security notes

- Passwords and PINs are hashed with bcrypt (never stored or logged in
  plain text).
- Student access tokens are unguessable, randomly generated identifiers —
  treat a student's link like a password; regenerate it if it's ever shared
  publicly by mistake.
- Every server action re-verifies the caller's role and, for
  classroom-scoped actions, that the teacher actually owns that classroom —
  this is enforced in `lib/guard.ts` on every request, not just in the UI.
- `middleware.ts` adds a first layer of route protection (redirects signed-out
  users, blocks students from teacher-only pages); the page/action-level
  checks are the real enforcement and hold even if middleware is bypassed.
- Set `NEXTAUTH_SECRET` to a long random value in every environment — this
  signs session tokens. Never commit `.env`.
- Always deploy behind HTTPS (Vercel does this automatically) so links,
  cookies, and login credentials aren't sent in the clear.
- This is a v1: for a production rollout at scale you'd want to add rate
  limiting on `/api/register` and the login endpoints (e.g. via
  Upstash/Vercel's edge rate limiting) to slow down brute-force attempts.

## Project structure

```
app/
  (auth)/login, (auth)/register     — teacher sign in / sign up
  s/[token]                         — student private-link auto-login
  classrooms/redirect               — post-login router
  dashboard                         — teacher overview across all classrooms
  classrooms/[id]                   — roster grid (shared: teacher edits, student views)
  classrooms/[id]/settings          — edit classroom + manage students (teacher only)
  api/auth/[...nextauth]            — NextAuth handler
  api/register                      — teacher sign-up endpoint
lib/
  auth.ts       — NextAuth config (teacher + student credential providers)
  guard.ts      — server-side authorization checks
  actions.ts    — Server Actions: all create/update/delete/toggle logic
  prisma.ts     — Prisma client singleton
prisma/
  schema.prisma — data model
  seed.ts       — optional demo data
```

## Extending it

Ideas that fit naturally on top of this foundation: CSV export of the
roster/progress grid, due dates per assignment column, email notifications
when a student's submit rate drops, multiple teachers per classroom
(co-teachers), and a "recent activity" feed on the dashboard.
