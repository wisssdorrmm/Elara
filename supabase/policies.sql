-- Ellara Row Level Security policies
-- Run after schema.sql. Ensures every user can only ever read/write their own rows.

alter table public.profiles enable row level security;
alter table public.periods enable row level security;
alter table public.logs enable row level security;

-- ============================================================
-- profiles
-- ============================================================
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ============================================================
-- periods
-- ============================================================
drop policy if exists "Users can view their own periods" on public.periods;
create policy "Users can view their own periods"
  on public.periods for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own periods" on public.periods;
create policy "Users can insert their own periods"
  on public.periods for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own periods" on public.periods;
create policy "Users can update their own periods"
  on public.periods for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own periods" on public.periods;
create policy "Users can delete their own periods"
  on public.periods for delete
  using (auth.uid() = user_id);

-- ============================================================
-- logs
-- ============================================================
drop policy if exists "Users can view their own logs" on public.logs;
create policy "Users can view their own logs"
  on public.logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own logs" on public.logs;
create policy "Users can insert their own logs"
  on public.logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own logs" on public.logs;
create policy "Users can update their own logs"
  on public.logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own logs" on public.logs;
create policy "Users can delete their own logs"
  on public.logs for delete
  using (auth.uid() = user_id);
