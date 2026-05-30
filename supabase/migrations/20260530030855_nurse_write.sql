-- Nurse-write portal (slice L): summary lifecycle, audit log, RLS tightening.
-- Builds on 20260519000000_init.sql. No destructive changes to existing tables.

-- ─────────────────────────────────────────────────────────
-- 1. Lifecycle columns on visit_summaries
-- ─────────────────────────────────────────────────────────
alter table public.visit_summaries
  add column if not exists status text not null default 'draft'
    check (status in ('draft','submitted','in_review','changes_requested','published')),
  add column if not exists sent_back_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists published_at timestamptz;

create index if not exists visit_summaries_status_idx on public.visit_summaries(status);

-- Existing finalised rows (e.g. the seed summary) are treated as published.
update public.visit_summaries
  set status = 'published',
      published_at = coalesce(published_at, written_at)
  where finalised = true and status = 'draft';

-- ─────────────────────────────────────────────────────────
-- 2. Append-only audit log
-- ─────────────────────────────────────────────────────────
create table if not exists public.visit_summary_events (
  id uuid primary key default uuid_generate_v4(),
  visit_summary_id uuid not null references public.visit_summaries(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists visit_summary_events_summary_idx
  on public.visit_summary_events(visit_summary_id);

alter table public.visit_summary_events enable row level security;

-- Readable by: coordinator, the assigned nurse, or a member of the patient's family.
drop policy if exists "read events for accessible summaries" on public.visit_summary_events;
create policy "read events for accessible summaries"
  on public.visit_summary_events for select
  using (
    public.is_coordinator()
    or exists (
      select 1
      from public.visit_summaries vs
      join public.visits v on v.id = vs.visit_id
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where vs.id = visit_summary_id
        and (public.is_family_member(p.family_id) or public.is_assigned_nurse(vs.visit_id))
    )
  );

-- Insertable by: coordinator or the assigned nurse for that summary.
-- (In practice every event is written by the SECURITY DEFINER functions below,
--  which run as the table owner and bypass RLS. This policy is the safety net
--  for any direct insert. Crucially there is NO update or delete policy, so the
--  log is append-only for everyone using the API — nobody can edit or remove
--  history, not even a coordinator.)
drop policy if exists "insert events for own summaries" on public.visit_summary_events;
create policy "insert events for own summaries"
  on public.visit_summary_events for insert
  with check (
    public.is_coordinator()
    or exists (
      select 1 from public.visit_summaries vs
      where vs.id = visit_summary_id and public.is_assigned_nurse(vs.visit_id)
    )
  );

-- ─────────────────────────────────────────────────────────
-- 3. Retarget the nurse content-edit policy to the new states
-- ─────────────────────────────────────────────────────────
-- A nurse may edit clinical content only while a summary is draft or
-- changes_requested. The with-check keeps the row in an editable state, so a
-- nurse can never raw-update a summary into submitted/in_review/published.
drop policy if exists "assigned nurses can update their not-yet-finalised summaries"
  on public.visit_summaries;
drop policy if exists "assigned nurses can edit editable summaries"
  on public.visit_summaries;

create policy "assigned nurses can edit editable summaries"
  on public.visit_summaries for update
  using (public.is_assigned_nurse(visit_id) and status in ('draft','changes_requested'))
  with check (public.is_assigned_nurse(visit_id) and status in ('draft','changes_requested'));

-- ─────────────────────────────────────────────────────────
-- 4. Tighten family read access to PUBLISHED only
-- ─────────────────────────────────────────────────────────
drop policy if exists "family members can read summaries for their visits"
  on public.visit_summaries;
drop policy if exists "family members can read published summaries"
  on public.visit_summaries;

create policy "family members can read published summaries"
  on public.visit_summaries for select
  using (
    status = 'published'
    and exists (
      select 1
      from public.visits v
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where v.id = visit_id and public.is_family_member(p.family_id)
    )
  );

drop policy if exists "family members can read photos for their summaries"
  on public.wound_photos;
drop policy if exists "family members can read photos for published summaries"
  on public.wound_photos;

create policy "family members can read photos for published summaries"
  on public.wound_photos for select
  using (
    exists (
      select 1
      from public.visit_summaries vs
      join public.visits v on v.id = vs.visit_id
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where vs.id = visit_summary_id
        and vs.status = 'published'
        and public.is_family_member(p.family_id)
    )
  );

-- ─────────────────────────────────────────────────────────
-- 5. State-machine functions (SECURITY DEFINER)
--    Each checks authorisation + current status, performs the transition,
--    and writes the audit event atomically.
-- ─────────────────────────────────────────────────────────
create or replace function public.submit_summary(target_summary_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
  cur_visit uuid;
begin
  select status, visit_id into cur_status, cur_visit
    from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if not public.is_assigned_nurse(cur_visit) then
    raise exception 'not authorised';
  end if;
  if cur_status not in ('draft','changes_requested') then
    raise exception 'cannot submit from status %', cur_status;
  end if;

  update public.visit_summaries
    set status = 'submitted', submitted_at = now(), sent_back_reason = null
    where id = target_summary_id;

  insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status)
    values (target_summary_id, auth.uid(), cur_status, 'submitted');
end;
$$;

create or replace function public.open_review(target_summary_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
begin
  if not public.is_coordinator() then
    raise exception 'not authorised';
  end if;
  select status into cur_status from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if cur_status = 'submitted' then
    update public.visit_summaries set status = 'in_review' where id = target_summary_id;
    insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status)
      values (target_summary_id, auth.uid(), 'submitted', 'in_review');
  end if;
end;
$$;

create or replace function public.publish_summary(target_summary_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
begin
  if not public.is_coordinator() then
    raise exception 'not authorised';
  end if;
  select status into cur_status from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if cur_status not in ('submitted','in_review') then
    raise exception 'cannot publish from status %', cur_status;
  end if;

  update public.visit_summaries
    set status = 'published', published_at = now(), finalised = true
    where id = target_summary_id;

  insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status)
    values (target_summary_id, auth.uid(), cur_status, 'published');
end;
$$;

create or replace function public.send_back_summary(target_summary_id uuid, send_back_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
begin
  if not public.is_coordinator() then
    raise exception 'not authorised';
  end if;
  select status into cur_status from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if cur_status not in ('submitted','in_review') then
    raise exception 'cannot send back from status %', cur_status;
  end if;

  update public.visit_summaries
    set status = 'changes_requested', sent_back_reason = send_back_reason
    where id = target_summary_id;

  insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status, reason)
    values (target_summary_id, auth.uid(), cur_status, 'changes_requested', send_back_reason);
end;
$$;

grant execute on function public.submit_summary(uuid) to authenticated;
grant execute on function public.open_review(uuid) to authenticated;
grant execute on function public.publish_summary(uuid) to authenticated;
grant execute on function public.send_back_summary(uuid, text) to authenticated;
