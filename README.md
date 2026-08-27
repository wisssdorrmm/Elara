# Ellara

A calming, modern women's health app for tracking your menstrual cycle, predicting periods, logging symptoms and moods, and staying on top of reminders. Built as a mobile-first Progressive Web App — designed to feel like **Apple Health meets Notion**, not a clinical medical tool.

## Overview

- Track periods and view predicted upcoming cycles
- Log daily symptoms, mood, and flow
- Visual calendar with period / predicted / ovulation / fertile-window states
- Personalized onboarding (goal, cycle length, reminders)
- Secure auth and per-user data isolation via Supabase Row Level Security

## Tech Stack

React · Vite · TypeScript · Tailwind CSS · Supabase · React Router · React Hook Form · Zod · date-fns · Framer Motion · Lucide React · React Hot Toast

## Folder Structure

```
src/
  assets/            static assets
  components/
    ui/              Button, Input, Card, Badge, Avatar, Modal, Loading, EmptyState
    layout/          Navbar, BottomNavigation, AppShell, ProtectedRoute
    CalendarCard.tsx
    CycleCard.tsx
  pages/             one file/folder per route
  hooks/             useAuth, etc.
  contexts/          AuthContext
  services/          (reserved for future API/service layers)
  lib/               supabase.ts — the single Supabase client
  types/             database.ts, index.ts
  utils/             cn.ts, etc.
  styles/            index.css (Tailwind entry)
  constants/         (reserved for shared constants)
  App.tsx
  main.tsx
supabase/
  schema.sql         table definitions
  policies.sql        Row Level Security policies
  seed.sql            optional local dev seed data
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your Supabase project credentials (Project Settings → API):

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never commit `.env` — it's already in `.gitignore`.

### 3. Set up the database

In the Supabase SQL editor (or via the CLI), run in order:

```bash
supabase/schema.sql     # tables
supabase/policies.sql   # row level security
supabase/seed.sql       # optional — local dev sample data
```

### 4. Run locally

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Deployment

The app is a static PWA build and deploys to any static host (Vercel, Netlify, Cloudflare Pages, etc.):

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your host's dashboard.
2. Build command: `npm run build`
3. Output directory: `dist`

`vercel.json` in the repo root rewrites all paths to `index.html`, so refreshing or directly linking to a route like `/dashboard` won't 404 (this app uses React Router's `BrowserRouter`, which needs that on any static host).

Remember to add your deployed domain to Supabase → Authentication → URL Configuration (Site URL / Redirect URLs) so auth and password-reset links work correctly.

## Routes

| Path | Description |
|---|---|
| `/` | Splash / landing |
| `/login` | Log in |
| `/register` | Create account |
| `/forgot-password` | Password reset |
| `/onboarding` | Goal, profile, last period, cycle length, reminders |
| `/dashboard` | Home — next period countdown, quick actions |
| `/calendar` | Monthly cycle calendar |
| `/log`, `/log/flow`, `/log/symptoms`, `/log/mood` | Logging flows |
| `/history` | Past cycles |
| `/profile` | Profile & menu |
| `/settings` | App settings |
| `*` | Redirects to a custom 404 |

## Status

Beyond the original foundation build, Ellara now includes full period/symptom/mood logging, cycle predictions and insights, end-of-period reports, and a couple engagement platform (invites, daily check-ins, appreciations, shared timeline, streaks, XP/levels, and a couple Q&A game). Push notifications for period reminders are not yet implemented (local/foreground notifications only).
