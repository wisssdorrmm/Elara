# Ellara Part 7 — Setup

## 1. Supabase SQL

Open Supabase → SQL Editor and run:

`supabase/migrations/20260808_part7.sql`

Run it only after the existing Ellara schema and policies are already installed.

This migration is additive. It does not intentionally modify `profiles`, `periods`, `logs`, `couple_invites`, `relationships`, or `accept_couple_invite()`.

## 2. What it adds

- Couple streaks + streak events
- Date history
- Relationship timeline
- Daily couple check-ins with private/shared controls
- Appreciation
- Weekly challenges + progress
- Couple XP events
- Couple badges
- Notifications
- Partner alerts
- Relationship-member security helper
- Secure partner-notification RPC

## 3. After SQL succeeds

Run:

```bash
npm install
npm run build
npm run lint
npm run dev
```

Then test Couple and Notifications while logged in as two separate test users.

## 4. Important

The current web implementation creates in-app notification records. True lock-screen push notifications while the browser is closed require a later Web Push/native implementation and VAPID/push infrastructure; this Part 7 does not pretend otherwise.
