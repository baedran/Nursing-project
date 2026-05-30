-- Fix: the assigned nurse could not read her own summary's audit events.
--
-- The previous "read events for accessible summaries" policy did its
-- access check with INLINE joins through cases + patients. Those tables have
-- no nurse SELECT policy, so RLS silently filtered them out mid-join and the
-- nurse branch always evaluated false. (Coordinator + family branches worked
-- because they have policies on those tables / use is_coordinator().)
--
-- Fix: move the whole check into a SECURITY DEFINER helper so the internal
-- joins bypass RLS — the same pattern is_family_member / is_assigned_nurse use.

create or replace function public.can_read_summary_events(target_summary_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.visit_summaries vs
    join public.visits v on v.id = vs.visit_id
    join public.cases c on c.id = v.case_id
    join public.patients p on p.id = c.patient_id
    where vs.id = target_summary_id
      and (
        public.is_coordinator()
        or public.is_family_member(p.family_id)
        or public.is_assigned_nurse(vs.visit_id)
      )
  );
$$;

grant execute on function public.can_read_summary_events(uuid) to authenticated;

drop policy if exists "read events for accessible summaries" on public.visit_summary_events;
create policy "read events for accessible summaries"
  on public.visit_summary_events for select
  using (public.can_read_summary_events(visit_summary_id));
