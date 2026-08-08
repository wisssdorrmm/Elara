-- ELLARA PART 7 — Couple engagement, memories and notifications
-- Run AFTER the existing Ellara schema/policies.
-- This migration is additive: it does not modify profiles, periods, logs,
-- couple_invites, relationships, or accept_couple_invite().

create or replace function public.is_relationship_member(p_relationship_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.relationships r
    where r.id = p_relationship_id
      and r.status = 'active'
      and (r.user_one_id = auth.uid() or r.user_two_id = auth.uid())
  );
$$;

grant execute on function public.is_relationship_member(uuid) to authenticated;

create table if not exists public.couple_streaks (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  streak_type text not null check (streak_type in ('daily_checkin','appreciation','date_night','challenge','quality_time')),
  current_count integer not null default 0 check (current_count >= 0),
  longest_count integer not null default 0 check (longest_count >= 0),
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, streak_type)
);

create table if not exists public.couple_streak_events (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  streak_type text not null check (streak_type in ('daily_checkin','appreciation','date_night','challenge','quality_time')),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  source text not null,
  created_at timestamptz not null default now(),
  unique (relationship_id, streak_type, user_id, activity_date, source)
);

create table if not exists public.couple_dates (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  date_on date not null,
  location text,
  rating smallint check (rating between 1 and 5),
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couple_timeline_events (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('started_dating','first_date','anniversary','birthday','trip','milestone','memory','challenge')),
  title text not null check (length(trim(title)) between 1 and 160),
  event_date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couple_checkins (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  feeling text not null check (feeling in ('loved','happy','supported','appreciated','peaceful','hurt','ignored')),
  note text,
  is_shared boolean not null default false,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, user_id, checkin_date)
);

create table if not exists public.couple_appreciations (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (length(trim(message)) between 1 and 280),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create table if not exists public.couple_challenges (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  week_start date not null,
  week_end date not null,
  xp_reward integer not null default 50 check (xp_reward > 0),
  created_at timestamptz not null default now(),
  unique (week_start)
);

create table if not exists public.couple_challenge_progress (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  challenge_id uuid not null references public.couple_challenges(id) on delete cascade,
  completed_by uuid references auth.users(id) on delete set null,
  progress integer not null default 0 check (progress >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, challenge_id)
);

create table if not exists public.couple_xp_events (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  source text not null,
  source_key text not null,
  xp integer not null check (xp > 0),
  created_at timestamptz not null default now(),
  unique (relationship_id, source, source_key)
);

create table if not exists public.couple_badges (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_relationship_badges (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  badge_id uuid not null references public.couple_badges(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (relationship_id, badge_id)
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship_id uuid references public.relationships(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  action_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_alerts (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null check (alert_type in ('thinking_of_you','sending_love','here_for_you','hope_you_are_well','feeling_down','call_me')),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists couple_streaks_relationship_idx on public.couple_streaks(relationship_id);
create index if not exists couple_streak_events_relationship_date_idx on public.couple_streak_events(relationship_id, activity_date desc);
create index if not exists couple_dates_relationship_date_idx on public.couple_dates(relationship_id, date_on desc);
create index if not exists couple_timeline_relationship_date_idx on public.couple_timeline_events(relationship_id, event_date desc);
create index if not exists couple_checkins_relationship_date_idx on public.couple_checkins(relationship_id, checkin_date desc);
create index if not exists couple_appreciations_recipient_idx on public.couple_appreciations(recipient_id, created_at desc);
create index if not exists couple_challenge_progress_relationship_idx on public.couple_challenge_progress(relationship_id);
create index if not exists couple_xp_relationship_idx on public.couple_xp_events(relationship_id, created_at desc);
create index if not exists couple_relationship_badges_relationship_idx on public.couple_relationship_badges(relationship_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at) where read_at is null;
create index if not exists couple_alerts_recipient_idx on public.couple_alerts(recipient_id, created_at desc);

insert into public.couple_badges (code, name, description, icon) values
  ('first_checkin', 'First Check-in', 'Completed your first couple check-in.', '❤️'),
  ('first_date', 'First Date', 'Logged your first date together.', '📅'),
  ('seven_day_streak', '7 Day Streak', 'Kept a couple streak for 7 days.', '🔥'),
  ('thirty_day_streak', '30 Day Streak', 'Kept a couple streak for 30 days.', '🔥'),
  ('appreciation_master', 'Appreciation Master', 'Sent meaningful appreciation to your partner.', '💌'),
  ('challenge_completed', 'Challenge Completed', 'Completed a weekly couple challenge.', '🎁'),
  ('golden_hearts', 'Golden Hearts', 'Reached the Golden Hearts level.', '🏆'),
  ('relationship_milestone', 'Relationship Milestone', 'Celebrated an important relationship milestone.', '🎂')
on conflict (code) do update set name = excluded.name, description = excluded.description, icon = excluded.icon;

alter table public.couple_streaks enable row level security;
alter table public.couple_streak_events enable row level security;
alter table public.couple_dates enable row level security;
alter table public.couple_timeline_events enable row level security;
alter table public.couple_checkins enable row level security;
alter table public.couple_appreciations enable row level security;
alter table public.couple_challenges enable row level security;
alter table public.couple_challenge_progress enable row level security;
alter table public.couple_xp_events enable row level security;
alter table public.couple_badges enable row level security;
alter table public.couple_relationship_badges enable row level security;
alter table public.notifications enable row level security;
alter table public.couple_alerts enable row level security;

create or replace function public.send_partner_notification(
  p_relationship_id uuid,
  p_recipient_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_relationship_member(p_relationship_id) then
    raise exception 'Not a member of this relationship';
  end if;
  if p_recipient_id = auth.uid() then
    raise exception 'Recipient must be the other partner';
  end if;
  if not exists (
    select 1 from public.relationships r
    where r.id = p_relationship_id and r.status = 'active'
      and p_recipient_id in (r.user_one_id, r.user_two_id)
  ) then
    raise exception 'Recipient is not a member of this relationship';
  end if;
  insert into public.notifications(user_id, relationship_id, type, title, message, action_path)
  values (p_recipient_id, p_relationship_id, p_type, p_title, p_message, p_action_path)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.send_partner_notification(uuid, uuid, text, text, text, text) to authenticated;

-- Shared couple tables: only active relationship members can access rows.
drop policy if exists "relationship members read streaks" on public.couple_streaks;
create policy "relationship members read streaks" on public.couple_streaks for select using (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members write streaks" on public.couple_streaks;
create policy "relationship members write streaks" on public.couple_streaks for all using (public.is_relationship_member(relationship_id)) with check (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members read streak events" on public.couple_streak_events;
create policy "relationship members read streak events" on public.couple_streak_events for select using (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members write streak events" on public.couple_streak_events;
create policy "relationship members write streak events" on public.couple_streak_events for insert with check (public.is_relationship_member(relationship_id) and auth.uid() = user_id);
drop policy if exists "relationship members read dates" on public.couple_dates;
create policy "relationship members read dates" on public.couple_dates for select using (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members write dates" on public.couple_dates;
create policy "relationship members write dates" on public.couple_dates for all using (public.is_relationship_member(relationship_id)) with check (public.is_relationship_member(relationship_id) and auth.uid() = created_by);
drop policy if exists "relationship members read timeline" on public.couple_timeline_events;
create policy "relationship members read timeline" on public.couple_timeline_events for select using (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members write timeline" on public.couple_timeline_events;
create policy "relationship members write timeline" on public.couple_timeline_events for all using (public.is_relationship_member(relationship_id)) with check (public.is_relationship_member(relationship_id) and auth.uid() = created_by);

-- Check-ins: owner sees private entries; partner sees only explicitly shared entries.
drop policy if exists "checkin owner or shared partner read" on public.couple_checkins;
create policy "checkin owner or shared partner read" on public.couple_checkins for select using (
  auth.uid() = user_id or (is_shared and public.is_relationship_member(relationship_id))
);
drop policy if exists "checkin owner insert" on public.couple_checkins;
create policy "checkin owner insert" on public.couple_checkins for insert with check (
  auth.uid() = user_id and public.is_relationship_member(relationship_id)
);
drop policy if exists "checkin owner update" on public.couple_checkins;
create policy "checkin owner update" on public.couple_checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_relationship_member(relationship_id));
drop policy if exists "checkin owner delete" on public.couple_checkins;
create policy "checkin owner delete" on public.couple_checkins for delete using (auth.uid() = user_id);

drop policy if exists "relationship members read appreciation" on public.couple_appreciations;
create policy "relationship members read appreciation" on public.couple_appreciations for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "relationship members send appreciation" on public.couple_appreciations;
create policy "relationship members send appreciation" on public.couple_appreciations for insert with check (
  auth.uid() = sender_id and public.is_relationship_member(relationship_id)
);

drop policy if exists "authenticated read challenges" on public.couple_challenges;
create policy "authenticated read challenges" on public.couple_challenges for select to authenticated using (true);
drop policy if exists "relationship members read challenge progress" on public.couple_challenge_progress;
create policy "relationship members read challenge progress" on public.couple_challenge_progress for select using (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members write challenge progress" on public.couple_challenge_progress;
create policy "relationship members write challenge progress" on public.couple_challenge_progress for all using (public.is_relationship_member(relationship_id)) with check (public.is_relationship_member(relationship_id));

drop policy if exists "relationship members read xp" on public.couple_xp_events;
create policy "relationship members read xp" on public.couple_xp_events for select using (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members write xp" on public.couple_xp_events;
create policy "relationship members write xp" on public.couple_xp_events for insert with check (public.is_relationship_member(relationship_id) and (user_id is null or user_id = auth.uid()));

drop policy if exists "authenticated read badges" on public.couple_badges;
create policy "authenticated read badges" on public.couple_badges for select to authenticated using (true);
drop policy if exists "relationship members read relationship badges" on public.couple_relationship_badges;
create policy "relationship members read relationship badges" on public.couple_relationship_badges for select using (public.is_relationship_member(relationship_id));
drop policy if exists "relationship members unlock badges" on public.couple_relationship_badges;
create policy "relationship members unlock badges" on public.couple_relationship_badges for insert with check (public.is_relationship_member(relationship_id));

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "users mark own notifications read" on public.notifications;
create policy "users mark own notifications read" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications" on public.notifications for delete using (auth.uid() = user_id);

drop policy if exists "relationship members read alerts" on public.couple_alerts;
create policy "relationship members read alerts" on public.couple_alerts for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "members send alerts" on public.couple_alerts;
create policy "members send alerts" on public.couple_alerts for insert with check (
  auth.uid() = sender_id and public.is_relationship_member(relationship_id) and recipient_id <> auth.uid()
);

-- Generic updated_at trigger for new mutable tables.
drop trigger if exists set_updated_at on public.couple_streaks;
create trigger set_updated_at before update on public.couple_streaks for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.couple_dates;
create trigger set_updated_at before update on public.couple_dates for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.couple_timeline_events;
create trigger set_updated_at before update on public.couple_timeline_events for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.couple_checkins;
create trigger set_updated_at before update on public.couple_checkins for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.couple_challenge_progress;
create trigger set_updated_at before update on public.couple_challenge_progress for each row execute procedure public.set_updated_at();

-- Seed a few rotating challenges for the current/future weeks. The app can use the latest week.
insert into public.couple_challenges (title, description, week_start, week_end, xp_reward)
select 'Meaningful Conversation', 'Spend 20 distraction-free minutes talking about your week.', date_trunc('week', current_date)::date, (date_trunc('week', current_date) + interval '6 days')::date, 50
where not exists (select 1 from public.couple_challenges where week_start = date_trunc('week', current_date)::date);
