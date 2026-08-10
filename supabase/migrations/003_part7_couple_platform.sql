-- ============================================================================
-- ELLARA PART 7 — SUPABASE SQL
-- Couple platform: streaks, dates, timeline, check-ins, appreciation,
-- XP/levels, badges, weekly challenges, partner alerts, notifications,
-- privacy controls.
--
-- SAFETY: This migration is 100% additive. It does not touch profiles,
-- periods, logs, couple_invites, relationships, or accept_couple_invite().
-- Every CREATE TABLE/FUNCTION uses IF NOT EXISTS / OR REPLACE (only where
-- return-type-safe) so it's safe to re-run.
--
-- Run this entire file once in Supabase SQL Editor.
-- ============================================================================


-- ============================================================================
-- 0. SAFETY CHECK — verify accept_couple_invite's signature before doing
--    anything else. This will raise an error and abort the whole script if
--    the live function doesn't match what we expect, rather than silently
--    proceeding against a different function than we think exists.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'accept_couple_invite'
      and pg_get_function_identity_arguments(p.oid) = 'invite text'
      and pg_get_function_result(p.oid) = 'uuid'
  ) then
    raise exception 'accept_couple_invite(invite text) returns uuid not found as expected - aborting migration for safety. Nothing has been changed.';
  end if;
end $$;

-- Nothing below this line touches accept_couple_invite, couple_invites,
-- relationships, profiles, periods, or logs.


-- ============================================================================
-- 1. HELPER FUNCTION — is the current user a member of this relationship?
--    Reused by every RLS policy below instead of repeating the same
--    subquery in every table. Not SECURITY DEFINER - it only reads what the
--    user could already read via relationships' own existing RLS.
-- ============================================================================
create or replace function public.is_relationship_member(p_relationship_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.relationships r
    where r.id = p_relationship_id
      and r.status = 'active'
      and (r.user_one_id = auth.uid() or r.user_two_id = auth.uid())
  );
$$;

-- Returns the OTHER user in an active relationship, given "my" id.
create or replace function public.get_partner_id(p_relationship_id uuid)
returns uuid
language sql
stable
as $$
  select case
    when r.user_one_id = auth.uid() then r.user_two_id
    else r.user_one_id
  end
  from public.relationships r
  where r.id = p_relationship_id
    and r.status = 'active'
    and (r.user_one_id = auth.uid() or r.user_two_id = auth.uid());
$$;


-- ============================================================================
-- 2. COUPLE STREAKS
-- ============================================================================
create table if not exists public.couple_streaks (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  streak_type text not null check (streak_type in ('daily_checkin', 'appreciation', 'date_night', 'weekly_challenge')),
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, streak_type)
);

create index if not exists couple_streaks_relationship_id_idx on public.couple_streaks (relationship_id);

drop trigger if exists set_updated_at on public.couple_streaks;
create trigger set_updated_at
  before update on public.couple_streaks
  for each row execute procedure public.set_updated_at();

alter table public.couple_streaks enable row level security;

drop policy if exists "Members can view their couple streaks" on public.couple_streaks;
create policy "Members can view their couple streaks"
  on public.couple_streaks for select
  using (public.is_relationship_member(relationship_id));

-- No direct INSERT/UPDATE policy for regular users - streaks are only ever
-- written by the SECURITY DEFINER trigger functions below (section 6), so a
-- user can never inflate their own streak by writing to this table directly.


-- ============================================================================
-- 3. DAILY COUPLE CHECK-INS (private by default - the core privacy case)
-- ============================================================================
create table if not exists public.daily_checkins (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null default current_date,
  feeling text not null check (feeling in ('loved', 'happy', 'supported', 'appreciated', 'peaceful', 'hurt', 'ignored', 'sad')),
  note text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  unique (relationship_id, user_id, checkin_date)
);

create index if not exists daily_checkins_relationship_id_idx on public.daily_checkins (relationship_id, checkin_date desc);

alter table public.daily_checkins enable row level security;

drop policy if exists "Users can view their own check-ins" on public.daily_checkins;
create policy "Users can view their own check-ins"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

-- THE KEY PRIVACY RULE: partner can only see a check-in if is_shared = true.
drop policy if exists "Partner can view shared check-ins only" on public.daily_checkins;
create policy "Partner can view shared check-ins only"
  on public.daily_checkins for select
  using (is_shared = true and public.is_relationship_member(relationship_id));

drop policy if exists "Users can insert their own check-ins" on public.daily_checkins;
create policy "Users can insert their own check-ins"
  on public.daily_checkins for insert
  with check (auth.uid() = user_id and public.is_relationship_member(relationship_id));

drop policy if exists "Users can update their own check-ins" on public.daily_checkins;
create policy "Users can update their own check-ins"
  on public.daily_checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own check-ins" on public.daily_checkins;
create policy "Users can delete their own check-ins"
  on public.daily_checkins for delete
  using (auth.uid() = user_id);


-- ============================================================================
-- 4. APPRECIATIONS (always visible to the recipient - not private/journal)
-- ============================================================================
create table if not exists public.appreciations (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists appreciations_relationship_id_idx on public.appreciations (relationship_id, created_at desc);

alter table public.appreciations enable row level security;

drop policy if exists "Sender or recipient can view appreciations" on public.appreciations;
create policy "Sender or recipient can view appreciations"
  on public.appreciations for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Sender can send appreciation to their partner" on public.appreciations;
create policy "Sender can send appreciation to their partner"
  on public.appreciations for insert
  with check (
    auth.uid() = sender_id
    and public.is_relationship_member(relationship_id)
    and recipient_id = public.get_partner_id(relationship_id)
  );


-- ============================================================================
-- 5. COUPLE DATES (Date History) + RELATIONSHIP TIMELINE
-- ============================================================================
create table if not exists public.couple_dates (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  date_on date not null,
  location text,
  rating smallint check (rating between 1 and 5),
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists couple_dates_relationship_id_idx on public.couple_dates (relationship_id, date_on desc);

drop trigger if exists set_updated_at on public.couple_dates;
create trigger set_updated_at
  before update on public.couple_dates
  for each row execute procedure public.set_updated_at();

alter table public.couple_dates enable row level security;

drop policy if exists "Members can view couple dates" on public.couple_dates;
create policy "Members can view couple dates"
  on public.couple_dates for select
  using (public.is_relationship_member(relationship_id));

drop policy if exists "Members can log couple dates" on public.couple_dates;
create policy "Members can log couple dates"
  on public.couple_dates for insert
  with check (auth.uid() = created_by and public.is_relationship_member(relationship_id));

drop policy if exists "Members can update couple dates" on public.couple_dates;
create policy "Members can update couple dates"
  on public.couple_dates for update
  using (public.is_relationship_member(relationship_id))
  with check (public.is_relationship_member(relationship_id));

drop policy if exists "Members can delete couple dates" on public.couple_dates;
create policy "Members can delete couple dates"
  on public.couple_dates for delete
  using (public.is_relationship_member(relationship_id));


create table if not exists public.relationship_timeline (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  event_type text not null check (
    event_type in ('started_dating', 'first_date', 'trip', 'birthday', 'anniversary', 'milestone', 'memory', 'challenge_completed', 'other')
  ),
  title text not null,
  description text,
  event_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists relationship_timeline_relationship_id_idx on public.relationship_timeline (relationship_id, event_date desc);

alter table public.relationship_timeline enable row level security;

drop policy if exists "Members can view timeline" on public.relationship_timeline;
create policy "Members can view timeline"
  on public.relationship_timeline for select
  using (public.is_relationship_member(relationship_id));

drop policy if exists "Members can add timeline entries" on public.relationship_timeline;
create policy "Members can add timeline entries"
  on public.relationship_timeline for insert
  with check (public.is_relationship_member(relationship_id));

drop policy if exists "Members can update timeline entries" on public.relationship_timeline;
create policy "Members can update timeline entries"
  on public.relationship_timeline for update
  using (public.is_relationship_member(relationship_id))
  with check (public.is_relationship_member(relationship_id));

drop policy if exists "Members can delete timeline entries" on public.relationship_timeline;
create policy "Members can delete timeline entries"
  on public.relationship_timeline for delete
  using (public.is_relationship_member(relationship_id));


-- ============================================================================
-- 6. COUPLE XP (ledger + running total - ledger prevents duplicate awards)
-- ============================================================================
create table if not exists public.couple_xp_events (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  source_type text not null check (
    source_type in ('checkin', 'appreciation', 'date_logged', 'challenge_completed', 'streak_milestone')
  ),
  source_id uuid,
  xp_amount integer not null,
  created_at timestamptz not null default now(),
  -- The actual anti-duplicate-XP guard: the same originating row can only
  -- ever award XP once.
  unique (relationship_id, source_type, source_id)
);

create index if not exists couple_xp_events_relationship_id_idx on public.couple_xp_events (relationship_id);

alter table public.couple_xp_events enable row level security;

drop policy if exists "Members can view their XP history" on public.couple_xp_events;
create policy "Members can view their XP history"
  on public.couple_xp_events for select
  using (public.is_relationship_member(relationship_id));

-- No INSERT policy for regular users - XP is only ever written by the
-- SECURITY DEFINER trigger functions below.

create table if not exists public.couple_xp_totals (
  relationship_id uuid primary key references public.relationships (id) on delete cascade,
  total_xp integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.couple_xp_totals enable row level security;

drop policy if exists "Members can view their XP total" on public.couple_xp_totals;
create policy "Members can view their XP total"
  on public.couple_xp_totals for select
  using (public.is_relationship_member(relationship_id));

-- Levels are intentionally NOT a table - they're derived from total_xp by
-- fixed thresholds in the frontend (utils layer), same pattern as cycle
-- phase math. No database object needed; nothing to keep in sync.

create or replace function public.award_couple_xp(
  p_relationship_id uuid,
  p_user_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_xp_amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.couple_xp_events (relationship_id, user_id, source_type, source_id, xp_amount)
  values (p_relationship_id, p_user_id, p_source_type, p_source_id, p_xp_amount)
  on conflict (relationship_id, source_type, source_id) do nothing;

  if found then
    insert into public.couple_xp_totals (relationship_id, total_xp)
    values (p_relationship_id, p_xp_amount)
    on conflict (relationship_id)
    do update set total_xp = couple_xp_totals.total_xp + excluded.total_xp, updated_at = now();
  end if;
end;
$$;


-- ============================================================================
-- 7. BADGES (earned badges only - definitions/labels/icons live in the
--    frontend as constants, same pattern as FLOW_OPTIONS/MOOD_OPTIONS)
-- ============================================================================
create table if not exists public.couple_badges (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  unique (relationship_id, badge_key)
);

create index if not exists couple_badges_relationship_id_idx on public.couple_badges (relationship_id);

alter table public.couple_badges enable row level security;

drop policy if exists "Members can view their badges" on public.couple_badges;
create policy "Members can view their badges"
  on public.couple_badges for select
  using (public.is_relationship_member(relationship_id));

-- No INSERT policy for regular users - badges are only awarded by the
-- SECURITY DEFINER helper function below.

create or replace function public.award_couple_badge(p_relationship_id uuid, p_badge_key text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.couple_badges (relationship_id, badge_key)
  values (p_relationship_id, p_badge_key)
  on conflict (relationship_id, badge_key) do nothing;
$$;


-- ============================================================================
-- 8. WEEKLY CHALLENGES (challenge text lives in the frontend as a constant
--    list keyed by challenge_key, same reasoning as badges above)
-- ============================================================================
create table if not exists public.couple_weekly_challenges (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  week_start_date date not null,
  challenge_key text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, week_start_date)
);

create index if not exists couple_weekly_challenges_relationship_id_idx on public.couple_weekly_challenges (relationship_id, week_start_date desc);

drop trigger if exists set_updated_at on public.couple_weekly_challenges;
create trigger set_updated_at
  before update on public.couple_weekly_challenges
  for each row execute procedure public.set_updated_at();

alter table public.couple_weekly_challenges enable row level security;

drop policy if exists "Members can view their weekly challenges" on public.couple_weekly_challenges;
create policy "Members can view their weekly challenges"
  on public.couple_weekly_challenges for select
  using (public.is_relationship_member(relationship_id));

drop policy if exists "Members can update their weekly challenge status" on public.couple_weekly_challenges;
create policy "Members can update their weekly challenge status"
  on public.couple_weekly_challenges for update
  using (public.is_relationship_member(relationship_id))
  with check (public.is_relationship_member(relationship_id));

-- No direct INSERT policy for regular users - rows are created exclusively
-- via get_or_create_weekly_challenge() below, which atomically avoids the
-- race condition of both partners loading the dashboard at the same moment
-- and each trying to create this week's challenge.

create or replace function public.get_or_create_weekly_challenge(p_relationship_id uuid)
returns public.couple_weekly_challenges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date := date_trunc('week', current_date)::date; -- Monday
  v_challenge_keys text[] := array[
    'meaningful_conversation', 'give_appreciation', 'plan_a_date',
    'daily_checkins', 'thoughtful_gesture'
  ];
  v_row public.couple_weekly_challenges;
begin
  if not public.is_relationship_member(p_relationship_id) then
    raise exception 'Not a member of this relationship';
  end if;

  select * into v_row
  from public.couple_weekly_challenges
  where relationship_id = p_relationship_id and week_start_date = v_week_start;

  if not found then
    insert into public.couple_weekly_challenges (relationship_id, week_start_date, challenge_key)
    values (
      p_relationship_id,
      v_week_start,
      -- Deterministic per relationship+week, not random on every call.
      v_challenge_keys[1 + (('x' || substr(md5(p_relationship_id::text || v_week_start::text), 1, 8))::bit(32)::bigint % array_length(v_challenge_keys, 1))]
    )
    on conflict (relationship_id, week_start_date) do nothing
    returning * into v_row;

    if v_row is null then
      -- Lost the race to a concurrent call - just read what the other call inserted.
      select * into v_row
      from public.couple_weekly_challenges
      where relationship_id = p_relationship_id and week_start_date = v_week_start;
    end if;
  end if;

  return v_row;
end;
$$;

create or replace function public.complete_weekly_challenge(p_challenge_id uuid)
returns public.couple_weekly_challenges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.couple_weekly_challenges;
begin
  select * into v_row from public.couple_weekly_challenges where id = p_challenge_id;

  if not found then
    raise exception 'Challenge not found';
  end if;

  if not public.is_relationship_member(v_row.relationship_id) then
    raise exception 'Not a member of this relationship';
  end if;

  if v_row.status = 'completed' then
    return v_row; -- already completed, no-op (prevents repeat XP)
  end if;

  update public.couple_weekly_challenges
  set status = 'completed', completed_at = now(), xp_awarded = 20
  where id = p_challenge_id
  returning * into v_row;

  perform public.award_couple_xp(v_row.relationship_id, auth.uid(), 'challenge_completed', v_row.id, 20);

  insert into public.relationship_timeline (relationship_id, created_by, event_type, title, event_date)
  values (v_row.relationship_id, auth.uid(), 'challenge_completed', 'Weekly challenge completed', current_date);

  insert into public.notifications (user_id, relationship_id, type, title, message)
  select public.get_partner_id(v_row.relationship_id), v_row.relationship_id, 'challenge_completed',
         'Weekly challenge completed! 🎁', 'Your partner completed this week''s challenge.'
  where public.get_partner_id(v_row.relationship_id) is not null;

  return v_row;
end;
$$;


-- ============================================================================
-- 9. NOTIFICATIONS + PARTNER ALERTS
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  relationship_id uuid references public.relationships (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  action_path text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_id_unread_idx on public.notifications (user_id) where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Deliberately NO insert policy for regular users. Every notification is
-- created by a SECURITY DEFINER function/trigger (this file), so one user
-- can never write directly into another user's notification feed.


create table if not exists public.partner_alerts (
  id uuid primary key default uuid_generate_v4(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  alert_type text not null check (
    alert_type in ('thinking_of_you', 'sending_love', 'im_here_for_you', 'hope_good_day', 'feeling_down', 'call_me')
  ),
  created_at timestamptz not null default now()
);

create index if not exists partner_alerts_relationship_id_idx on public.partner_alerts (relationship_id, created_at desc);

alter table public.partner_alerts enable row level security;

drop policy if exists "Sender or recipient can view alerts" on public.partner_alerts;
create policy "Sender or recipient can view alerts"
  on public.partner_alerts for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Sender can send alert to their partner" on public.partner_alerts;
create policy "Sender can send alert to their partner"
  on public.partner_alerts for insert
  with check (
    auth.uid() = sender_id
    and public.is_relationship_member(relationship_id)
    and recipient_id = public.get_partner_id(relationship_id)
  );

-- Alert labels (e.g. "Thinking of you" -> "❤️ Thinking of you") live in the
-- frontend, same pattern as badges/challenges.
create or replace function public.notify_partner_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, relationship_id, type, title, message, action_path)
  values (
    new.recipient_id, new.relationship_id, 'partner_alert',
    'Your partner sent you an alert',
    case new.alert_type
      when 'thinking_of_you' then '❤️ Thinking of you'
      when 'sending_love' then '💕 Sending you love'
      when 'im_here_for_you' then '🫶 I''m here for you'
      when 'hope_good_day' then '😊 Hope you''re having a good day'
      when 'feeling_down' then '🥺 I''m feeling down'
      when 'call_me' then '📞 Call me'
    end,
    '/couple'
  );
  return new;
end;
$$;

drop trigger if exists notify_on_partner_alert on public.partner_alerts;
create trigger notify_on_partner_alert
  after insert on public.partner_alerts
  for each row execute procedure public.notify_partner_alert();


-- One-off callable function - client calls this once right after
-- coupleService.acceptInvite() succeeds. Kept separate from
-- accept_couple_invite() itself so that existing function is never touched.
create or replace function public.notify_relationship_connected(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rel public.relationships;
begin
  select * into v_rel from public.relationships where id = p_relationship_id;
  if not found then
    return;
  end if;

  insert into public.notifications (user_id, relationship_id, type, title, message, action_path)
  values
    (v_rel.user_one_id, v_rel.id, 'relationship_connected', 'You''re connected! 🎉', 'Your partner accepted your invitation.', '/couple/dashboard'),
    (v_rel.user_two_id, v_rel.id, 'relationship_connected', 'You''re connected! 🎉', 'You''re now connected with your partner.', '/couple/dashboard');

  insert into public.relationship_timeline (relationship_id, event_type, title, event_date)
  values (v_rel.id, 'started_dating', 'Connected on Ellara', current_date);
end;
$$;


-- ============================================================================
-- 10. CHECK-IN / APPRECIATION / DATE TRIGGERS — award XP + streaks + badges
--     from real activity only. Each is SECURITY DEFINER so regular users
--     can never award themselves XP/streak progress by writing to
--     couple_xp_events or couple_streaks directly (they have no INSERT
--     policy on those tables at all).
-- ============================================================================
create or replace function public.handle_checkin_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak public.couple_streaks;
  v_checkin_count integer;
begin
  perform public.award_couple_xp(new.relationship_id, new.user_id, 'checkin', new.id, 5);

  select * into v_streak
  from public.couple_streaks
  where relationship_id = new.relationship_id and streak_type = 'daily_checkin'
  for update;

  if not found then
    insert into public.couple_streaks (relationship_id, streak_type, current_streak, longest_streak, last_activity_date)
    values (new.relationship_id, 'daily_checkin', 1, 1, new.checkin_date);
  elsif v_streak.last_activity_date = new.checkin_date then
    -- Same day, already counted (e.g. partner also checked in today) - no-op.
    null;
  elsif v_streak.last_activity_date = new.checkin_date - 1 then
    update public.couple_streaks
    set current_streak = v_streak.current_streak + 1,
        longest_streak = greatest(v_streak.longest_streak, v_streak.current_streak + 1),
        last_activity_date = new.checkin_date
    where id = v_streak.id;
  else
    -- Gap of 2+ days - streak resets to 1, starting today.
    update public.couple_streaks
    set current_streak = 1,
        longest_streak = greatest(v_streak.longest_streak, 1),
        last_activity_date = new.checkin_date
    where id = v_streak.id;
  end if;

  select count(*) into v_checkin_count from public.daily_checkins where relationship_id = new.relationship_id;
  if v_checkin_count = 1 then
    perform public.award_couple_badge(new.relationship_id, 'first_checkin');
  end if;

  select current_streak into v_checkin_count from public.couple_streaks
  where relationship_id = new.relationship_id and streak_type = 'daily_checkin';
  if v_checkin_count = 7 then
    perform public.award_couple_badge(new.relationship_id, 'streak_7');
  elsif v_checkin_count = 30 then
    perform public.award_couple_badge(new.relationship_id, 'streak_30');
  end if;

  insert into public.notifications (user_id, relationship_id, type, title, message, action_path)
  select public.get_partner_id(new.relationship_id), new.relationship_id, 'partner_checkin',
         'Your partner checked in today', 'They completed today''s check-in.', '/couple'
  where public.get_partner_id(new.relationship_id) is not null;

  return new;
end;
$$;

drop trigger if exists on_checkin_created on public.daily_checkins;
create trigger on_checkin_created
  after insert on public.daily_checkins
  for each row execute procedure public.handle_checkin_activity();


create or replace function public.handle_appreciation_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sent_count integer;
begin
  perform public.award_couple_xp(new.relationship_id, new.sender_id, 'appreciation', new.id, 5);

  select count(*) into v_sent_count from public.appreciations where relationship_id = new.relationship_id;
  if v_sent_count >= 10 then
    perform public.award_couple_badge(new.relationship_id, 'appreciation_master');
  end if;

  insert into public.notifications (user_id, relationship_id, type, title, message, action_path)
  values (new.recipient_id, new.relationship_id, 'appreciation', 'Your partner appreciates you 💌', new.message, '/couple');

  return new;
end;
$$;

drop trigger if exists on_appreciation_created on public.appreciations;
create trigger on_appreciation_created
  after insert on public.appreciations
  for each row execute procedure public.handle_appreciation_activity();


create or replace function public.handle_date_logged_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_couple_xp(new.relationship_id, new.created_by, 'date_logged', new.id, 10);

  insert into public.relationship_timeline (relationship_id, created_by, event_type, title, description, event_date)
  values (new.relationship_id, new.created_by, 'memory', new.title, new.notes, new.date_on);

  insert into public.notifications (user_id, relationship_id, type, title, message, action_path)
  select public.get_partner_id(new.relationship_id), new.relationship_id, 'date_logged',
         'A new date was logged 📅', new.title, '/couple'
  where public.get_partner_id(new.relationship_id) is not null;

  return new;
end;
$$;

drop trigger if exists on_date_logged on public.couple_dates;
create trigger on_date_logged
  after insert on public.couple_dates
  for each row execute procedure public.handle_date_logged_activity();


-- ============================================================================
-- 11. PRIVACY SETTINGS
-- ============================================================================
create table if not exists public.privacy_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  share_cycle_with_partner boolean not null default false,
  share_mood_with_partner boolean not null default false,
  share_symptoms_with_partner boolean not null default false,
  share_journal_with_partner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.privacy_settings;
create trigger set_updated_at
  before update on public.privacy_settings
  for each row execute procedure public.set_updated_at();

alter table public.privacy_settings enable row level security;

drop policy if exists "Users can view their own privacy settings" on public.privacy_settings;
create policy "Users can view their own privacy settings"
  on public.privacy_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert their own privacy settings" on public.privacy_settings;
create policy "Users can upsert their own privacy settings"
  on public.privacy_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own privacy settings" on public.privacy_settings;
create policy "Users can update their own privacy settings"
  on public.privacy_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================================
-- 12. GRANTS — allow authenticated users to call the RPC functions above.
--     (Table-level access is already governed by the RLS policies above;
--     these grants only cover the handful of functions clients call directly.)
-- ============================================================================
grant execute on function public.award_couple_xp(uuid, uuid, text, uuid, integer) to authenticated;
grant execute on function public.award_couple_badge(uuid, text) to authenticated;
grant execute on function public.get_or_create_weekly_challenge(uuid) to authenticated;
grant execute on function public.complete_weekly_challenge(uuid) to authenticated;
grant execute on function public.notify_relationship_connected(uuid) to authenticated;
grant execute on function public.is_relationship_member(uuid) to authenticated;
grant execute on function public.get_partner_id(uuid) to authenticated;

-- ============================================================================
-- END OF ELLARA PART 7 SQL
-- ============================================================================
