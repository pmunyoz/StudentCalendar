# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

StudentDash is a student academic dashboard built with React 19, TypeScript, Vite 7, and Supabase as the backend (auth, database, storage). The UI is in Spanish. All application code lives directly in the root directory.

## Commands

All commands must be run from the root directory.

- **Install dependencies:** `npm install`
- **Dev server:** `npm run dev` (Vite HMR at localhost:5173)
- **Build:** `npm run build` (runs `tsc -b && vite build`, output in `dist/`)
- **Lint:** `npm run lint` (ESLint with typescript-eslint + react-hooks + react-refresh)
- **Preview production build:** `npm run preview`
- **Type-check only:** `tsc -b` (uses project references: `tsconfig.app.json` + `tsconfig.node.json`)

There is no test framework configured.

## Architecture

### Tech Stack

- **React 19** with react-router-dom v7 (BrowserRouter, nested routes)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no `tailwind.config` file — config is in `src/index.css` using `@theme` directive)
- **Supabase** for auth, database (Postgres), and file storage (avatars bucket)
- **lucide-react** for icons
- **clsx + tailwind-merge** via `cn()` utility in `src/lib/utils.ts`
- **react-helmet-async** for injecting security meta headers
- **dompurify** available for HTML sanitization

### Routing & Auth Flow

`App.tsx` defines all routes. Unauthenticated users are redirected to `/login`. Authenticated routes are nested under `/dashboard` using `<ProtectedRoute>` which checks Supabase session via `useAuth()`.

Route structure:
- `/login` — Login/Register page (standalone, no layout)
- `/dashboard` — `DashboardLayout` wraps all protected routes via `<Outlet />`
  - `/dashboard` (index) — Dashboard summary
  - `/dashboard/tasks` — Task management (CRUD with Supabase)
  - `/dashboard/exams` — Calendar view (currently static/hardcoded data)
  - `/dashboard/collab` — Collaboration/chat (static mockup)
  - `/dashboard/settings` — Profile editing (avatar upload, password change)

### State Management

No external state library. Auth state is managed via React Context (`src/context/AuthContext.tsx`) which provides `user`, `userName`, `avatarUrl`, `signOut`, and `refreshProfile`. Page-level state uses local `useState`/`useEffect` hooks that fetch directly from Supabase.

### Supabase Schema (inferred from queries)

- **profiles** — `id`, `first_name`, `last_name`, `birth_date`, `avatar_url`, `updated_at`
- **subjects** — `id`, `name`, `color`, `user_id`
- **tasks** — `id`, `title`, `user_id`, `subject_id` (FK → subjects), `due_date`, `completed`, `linked_id`, `linked_type` ('exam' | 'exercise'), `created_at`
- **exams** — `id`, `title`, `created_at`
- **exercises** — `id`, `title`, `created_at`
- **Storage bucket:** `avatars` (public URLs)

### Environment Variables

Defined in `.env` (gitignored). Required:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public key

### Key Patterns

- **UI components** (`src/components/ui/`) use `forwardRef` and the `cn()` utility for class merging. Follow this pattern for new primitives.
- **Custom theme colors** use `primary-*` tokens defined in `src/index.css` `@theme` block (blue palette). Use `primary-600` as the main brand color.
- **Security**: The app wraps the tree in `SecurityErrorBoundary` (class component) and injects security headers (CSP, X-Frame-Options, etc.) via `SecurityHeaders` using react-helmet-async. The CSP allowlist includes the Supabase project domain.
- **Pages with Supabase data** (Tasks, Settings) follow a pattern: check `user` from `useAuth()`, call Supabase in `useEffect`, store results in local state, show a `Loader2` spinner while loading.
- **Exams page** and **Collaboration page** are currently static mockups with hardcoded data — not yet connected to Supabase.
