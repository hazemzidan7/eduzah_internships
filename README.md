# Flutter Mastery — Course Management Platform

A training course management system for the "Flutter Mastery" course, built with Next.js (App Router), TypeScript, and Tailwind CSS. All data lives entirely in the browser via `localStorage` — there is no backend, database, or SQL involved.

## Roles

- **Admin / Instructor** — manage students, sessions, materials, assignments, and grade submissions from `/dashboard`, `/admin/students`, `/admin/sessions`, `/admin/submissions`.
- **Student** — view sessions in order, download materials, submit assignments, and track grades/feedback from `/dashboard` and `/sessions`.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Data & accounts

On first load, the app seeds `localStorage` (key `flutter-mastery-db`) with demo data: 1 admin, 1 instructor, 15 students, 8 course sessions (with materials and assignments), and a handful of sample submissions. The logged-in user's session is stored under `flutter-mastery-session`.

All demo accounts use the password `FlutterMastery2026!`:

- `admin@fluttermastery.com`
- `instructor@fluttermastery.com`
- `ahmed.mohamed@fluttermastery.com`, `omar.hassan@fluttermastery.com`, ... (see `src/lib/seed-data.ts` for the full roster)

Everything you do — creating students, sessions, materials, uploading assignments, grading — is persisted to `localStorage` in the browser. Uploaded files are stored as base64 data URLs (max 8MB per assignment submission). Clearing your browser's site data (or using a different browser/device) resets the app back to the seeded demo data.

## Project structure

```
src/
  app/
    login/                  Login page
    (dashboard)/            Authenticated shell (sidebar, theme toggle)
      dashboard/            Role-based overview (student progress / staff stats)
      sessions/             Student: session list & detail (materials, assignment upload)
      admin/
        students/           Staff: manage students (CRUD, filters, progress)
        sessions/           Staff: manage sessions, materials, assignments
        submissions/        Staff: review submissions, grade & give feedback
  components/                Shared UI (Sidebar, Topbar, ThemeToggle, ui primitives, admin widgets)
  lib/
    types.ts                 Local data model types (User, Session, Material, Submission)
    seed-data.ts              Demo data seeded into localStorage on first run
    store.tsx                 DataProvider/useData — localStorage-backed data layer
    auth.tsx                  AuthProvider/useAuth — local session-based auth
    utils.ts                  Formatting helpers
```

## Data model

- **users** — `id, name, email, password, phone, role (admin|instructor|student), createdAt`
- **sessions** — `id, orderIndex, title, description, assignmentTitle, assignmentDescription, deadline`
- **materials** — `id, sessionId, title, type (pdf|zip|doc|video|link), url, sizeBytes`
- **submissions** — `id, studentId, sessionId, fileUrl, fileName, submittedAt, status (not_submitted|submitted|reviewed), feedback, grade, reviewedAt`

## Features

- Local email/password auth backed by localStorage, with client-side role-based route guards
- Light/dark mode (next-themes)
- Responsive sidebar layout (mobile drawer, desktop rail)
- Drag-and-drop file uploads (materials & assignment submissions) stored as base64 data URLs
- Student progress tracking, grade averages, and upcoming-deadline view
- Staff dashboard with totals, completion rate, and recent submissions
- Student management with search and filters (completed / missing tasks / grade)
- Session & materials management (files + external links)
- Submission review workflow with grading and feedback
