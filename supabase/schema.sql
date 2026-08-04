-- HerCycle database schema
-- Run this first, then policies.sql, then optionally seed.sql

create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles
-- One row per user, holds onboarding answers and preferences.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text,
  date_of_birth date,
  country text,
  goal text check (
    goal in (
      'track_periods',
      'get_pregnant',
      'avoid_pregnancy',
      'understand_body',
      'manage_irregular_cycles'
    )
  ),
  average_cycle_length integer not null default 28,
  average_period_length integer not null default 5,
  cycle_is_regular boolean,
  reminder_days_before integer[] not null default '{5}',
  reminder_time time not null default '08:00',
  notifications_enabled boolean not null default true,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- periods
-- One row per logged period / cycle start.
-- ============================================================
create table if not exists public.periods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  flow text check (flow in ('light', 'medium', 'heavy', 'very_heavy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create index if not exists periods_user_id_start_date_idx
  on public.periods (user_id, start_date desc);

-- ============================================================
-- logs
-- One row per day of logged symptoms / mood / notes.
-- ============================================================
create table if not exists public.logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  symptoms text[] not null default '{}',
  mood text,
  pain_level smallint check (pain_level between 0 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists logs_user_id_log_date_idx
  on public.logs (user_id, log_date desc);

-- ============================================================
-- updated_at trigger, shared by all three tables
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.periods;
create trigger set_updated_at
  before update on public.periods
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.logs;
create trigger set_updated_at
  before update on public.logs
  for each row execute procedure public.set_updated_at();
