-- Caregivers Collective — sample seed data
--
-- Run this in the Supabase SQL Editor AFTER:
-- 1. You've signed up via the magic-link flow at /en/login at least once (so a user row exists)
-- 2. You know your auth.users.id (find it in Supabase Authentication → Users tab)
--
-- Before running: replace 'YOUR_AUTH_USER_ID_HERE' with your actual user UUID.

do $$
declare
  test_user_id uuid := 'YOUR_AUTH_USER_ID_HERE';  -- ← REPLACE THIS
  test_family_id uuid;
  test_patient_id uuid;
  test_case_id uuid;
  test_visit_id uuid;
  test_summary_id uuid;
begin
  -- Promote the user to coordinator role
  update public.profiles
  set role = 'coordinator',
      display_name = coalesce(display_name, 'Coordinator')
  where id = test_user_id;

  -- Create a sample family
  insert into public.families (display_name)
  values ('The Khoury Family')
  returning id into test_family_id;

  -- Link the user as the family owner
  insert into public.family_memberships (family_id, user_id, membership_role)
  values (test_family_id, test_user_id, 'owner');

  -- Create a sample patient
  insert into public.patients (family_id, display_label, age_band, district, notes)
  values (test_family_id, 'Mariam', '70-80', 'Achrafieh', 'Sample patient seeded for testing')
  returning id into test_patient_id;

  -- Create a sample case
  insert into public.cases (patient_id, case_ref, mode, status, notes)
  values (test_patient_id, 'Case 2026-051', 'shift', 'active', 'Sample case seeded for testing')
  returning id into test_case_id;

  -- Create a sample visit
  insert into public.visits (case_id, scheduled_at, status, started_at, completed_at)
  values (
    test_case_id,
    now() - interval '2 days',
    'completed',
    now() - interval '2 days',
    now() - interval '2 days' + interval '1 hour'
  )
  returning id into test_visit_id;

  -- Create a sample summary
  insert into public.visit_summaries (
    visit_id, vitals, done_body, observations_body, meds_administered, watch_items,
    next_visit_body, coordinator_note, finalised, written_at
  ) values (
    test_visit_id,
    '{"bp": "128/82", "hr": "74 bpm", "spo2": "97 %", "temp": "36.6 °C"}'::jsonb,
    'IV hydration session (Normal saline, 500 mL), vitals check, dressing change on left forearm.',
    'Mariam was alert, oriented, comfortable at rest. Mobility good, walked unassisted to the kitchen.',
    array['Vancomycin 1 g IV — 18:15, no adverse reaction'],
    array['Increased redness or warmth around the dressing site', 'Fever above 38 °C'],
    'Thursday 16 May · 18:30 — same nurse, same shape. Dressing change + vitals.',
    'Pharmacy delivered fresh dressings; supply on hand for 5 more changes.',
    true,
    now() - interval '2 days' + interval '90 minutes'
  )
  returning id into test_summary_id;

  raise notice 'Seeded: family=%, patient=%, case=%, visit=%, summary=%',
    test_family_id, test_patient_id, test_case_id, test_visit_id, test_summary_id;
end $$;
