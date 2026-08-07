-- Ellara migration: Couple Connect (Step 2)
-- Run this in your Supabase SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ============================================================
-- couple_invites
-- Created by the inviting user. Only the inviter can list/revoke
-- their own invites - the recipient never queries this table
-- directly, they call accept_couple_invite(code) below instead.
-- ============================================================
create table if not exists public.couple_invites (
  id uuid primary key default uuid_generate_v4(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz
);

create index if not exists couple_invites_inviter_id_idx on public.couple_invites (inviter_id);
create index if not exists couple_invites_code_idx on public.couple_invites (invite_code);

alter table public.couple_invites enable row level security;

drop policy if exists "Inviter can view their own invites" on public.couple_invites;
create policy "Inviter can view their own invites"
  on public.couple_invites for select
  using (auth.uid() = inviter_id);

drop policy if exists "Inviter can create invites" on public.couple_invites;
create policy "Inviter can create invites"
  on public.couple_invites for insert
  with check (auth.uid() = inviter_id);

drop policy if exists "Inviter can update their own invites" on public.couple_invites;
create policy "Inviter can update their own invites"
  on public.couple_invites for update
  using (auth.uid() = inviter_id)
  with check (auth.uid() = inviter_id);

drop policy if exists "Inviter can delete their own invites" on public.couple_invites;
create policy "Inviter can delete their own invites"
  on public.couple_invites for delete
  using (auth.uid() = inviter_id);

-- ============================================================
-- relationships
-- One row per couple. user_a_id is always the lexicographically
-- smaller UUID of the pair (enforced in accept_couple_invite), so
-- a pair never ends up stored both ways round.
-- ============================================================
create table if not exists public.relationships (
  id uuid primary key default uuid_generate_v4(),
  user_a_id uuid not null references auth.users (id) on delete cascade,
  user_b_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at date not null,
  anniversary_date date,
  first_date_at date,
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  check (user_a_id <> user_b_id)
);

create index if not exists relationships_user_a_id_idx on public.relationships (user_a_id);
create index if not exists relationships_user_b_id_idx on public.relationships (user_b_id);

drop trigger if exists set_updated_at on public.relationships;
create trigger set_updated_at
  before update on public.relationships
  for each row execute procedure public.set_updated_at();

alter table public.relationships enable row level security;

drop policy if exists "Either partner can view the relationship" on public.relationships;
create policy "Either partner can view the relationship"
  on public.relationships for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "Either partner can insert the relationship" on public.relationships;
create policy "Either partner can insert the relationship"
  on public.relationships for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "Either partner can update the relationship" on public.relationships;
create policy "Either partner can update the relationship"
  on public.relationships for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id)
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "Either partner can delete the relationship" on public.relationships;
create policy "Either partner can delete the relationship"
  on public.relationships for delete
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- ============================================================
-- accept_couple_invite(code)
-- Security-definer function: the ONLY way an invite gets accepted.
-- Runs with elevated privileges internally, but is only reachable
-- by an authenticated user, and every check inside is scoped to
-- auth.uid() - so it can safely bypass the invite-table RLS above
-- without exposing other users' invites.
-- ============================================================
create or replace function public.accept_couple_invite(p_invite_code text)
returns public.relationships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.couple_invites;
  v_relationship public.relationships;
  v_user_a uuid;
  v_user_b uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to accept an invite';
  end if;

  select * into v_invite
    from public.couple_invites
    where invite_code = p_invite_code
    for update;

  if not found then
    raise exception 'Invite code not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'This invite has already been used or revoked';
  end if;

  if v_invite.expires_at <= now() then
    update public.couple_invites set status = 'expired' where id = v_invite.id;
    raise exception 'This invite has expired';
  end if;

  if v_invite.inviter_id = auth.uid() then
    raise exception 'You cannot accept your own invite';
  end if;

  if exists (
    select 1 from public.relationships
    where status = 'active'
      and (user_a_id in (v_invite.inviter_id, auth.uid()) or user_b_id in (v_invite.inviter_id, auth.uid()))
  ) then
    raise exception 'One of you already has an active connection';
  end if;

  if v_invite.inviter_id < auth.uid() then
    v_user_a := v_invite.inviter_id;
    v_user_b := auth.uid();
  else
    v_user_a := auth.uid();
    v_user_b := v_invite.inviter_id;
  end if;

  insert into public.relationships (user_a_id, user_b_id, started_at, status)
  values (v_user_a, v_user_b, current_date, 'active')
  returning * into v_relationship;

  update public.couple_invites
    set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
    where id = v_invite.id;

  return v_relationship;
end;
$$;

grant execute on function public.accept_couple_invite(text) to authenticated;
