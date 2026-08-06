-- HerCycle migration: Part 5 - separate Period and Flow
-- Run this ONCE against your existing live Supabase project's SQL Editor.
-- Safe to run even if some steps were already applied (uses IF EXISTS/IF NOT EXISTS).

-- 1. Add the new columns Flow logging needs on `logs`.
alter table public.logs
  add column if not exists flow text,
  add column if not exists sleep_hours numeric(4, 1);

alter table public.logs
  add constraint logs_flow_check
  check (flow in ('spotting', 'light', 'medium', 'heavy', 'very_heavy'));

alter table public.logs
  add constraint logs_sleep_hours_check
  check (sleep_hours between 0 and 24);

-- 2. Backfill: copy each period's old single flow value onto the log row for
--    its start_date, so existing data isn't silently lost. This is a
--    best-effort backfill only (the old model had one flow value per period,
--    not per day, so it can only be placed on day 1).
update public.logs l
set flow = p.flow
from public.periods p
where l.user_id = p.user_id
  and l.log_date = p.start_date
  and l.flow is null
  and p.flow is not null;

-- 3. Drop the now-unused flow column from periods (Period screen never
--    manages flow anymore - see periodService.ts).
alter table public.periods drop column if exists flow;

-- Done. profiles and RLS policies are unchanged by this migration.
