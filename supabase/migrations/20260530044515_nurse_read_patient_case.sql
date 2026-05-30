-- Fix: an assigned nurse must be able to read the patient label + case ref for
-- visits she's assigned to (shown on her dashboard and the summary writer).
--
-- The init schema gave nurses a read policy on `visits` but NONE on `cases` or
-- `patients`. So nested selects like visits→cases→patients silently returned
-- null for nurses (RLS filtered the joined rows), rendering "—" in the UI.
--
-- Same pattern as the audit-read fix: route the cross-table check through
-- SECURITY DEFINER helpers so the internal joins bypass RLS, then add narrow
-- SELECT policies. This exposes only the assigned nurse's own patients/cases —
-- pseudonymous display_label, district, case_ref — which she needs to document
-- the visit. No write access is granted.

create or replace function public.is_nurse_for_case(target_case_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.visits v
    join public.nurses n on n.id = v.assigned_nurse_id
    where v.case_id = target_case_id and n.user_id = auth.uid()
  );
$$;

create or replace function public.is_nurse_for_patient(target_patient_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.visits v
    join public.cases c on c.id = v.case_id
    join public.nurses n on n.id = v.assigned_nurse_id
    where c.patient_id = target_patient_id and n.user_id = auth.uid()
  );
$$;

grant execute on function public.is_nurse_for_case(uuid) to authenticated;
grant execute on function public.is_nurse_for_patient(uuid) to authenticated;

drop policy if exists "assigned nurses can read their cases" on public.cases;
create policy "assigned nurses can read their cases"
  on public.cases for select
  using (public.is_nurse_for_case(id));

drop policy if exists "assigned nurses can read their patients" on public.patients;
create policy "assigned nurses can read their patients"
  on public.patients for select
  using (public.is_nurse_for_patient(id));
