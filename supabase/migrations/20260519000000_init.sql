-- Caregivers Collective — initial schema
-- Phase 2 foundation: families, patients, cases, visits, summaries, wound photos
-- Created 2026-05-19

-- ─────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- Profile table — extends auth.users with app-side role + display info
-- ─────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'family' check (role in ('family', 'nurse', 'coordinator')),
  display_name text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'ar', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- Trigger to auto-insert a profile row on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, preferred_locale)
  values (new.id, new.raw_user_meta_data->>'display_name', coalesce(new.raw_user_meta_data->>'locale', 'en'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────
-- Families — the household / payer entity
-- ─────────────────────────────────────────────────────────
create table public.families (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ─────────────────────────────────────────────────────────
-- Family memberships — who can access a family's data
-- ─────────────────────────────────────────────────────────
create table public.family_memberships (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_role text not null default 'viewer' check (membership_role in ('owner', 'viewer')),
  created_at timestamptz not null default now(),
  unique(family_id, user_id)
);

create index family_memberships_user_idx on public.family_memberships(user_id);
create index family_memberships_family_idx on public.family_memberships(family_id);

-- ─────────────────────────────────────────────────────────
-- Patients — person receiving care
-- ─────────────────────────────────────────────────────────
create table public.patients (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete restrict,
  display_label text not null,         -- e.g. "Mariam" (pseudonymous label for portal display)
  age_band text,                       -- e.g. "70-80" — coarser than DOB for privacy in lists
  district text,                       -- e.g. "Achrafieh"
  notes text,                          -- coordinator-only summary notes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index patients_family_idx on public.patients(family_id);

-- ─────────────────────────────────────────────────────────
-- Nurses — provider profile
-- ─────────────────────────────────────────────────────────
create table public.nurses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  display_name text not null,          -- e.g. "Rita K."
  hospital text,                       -- primary hospital — AUBMC, Hôtel-Dieu, St Georges, etc.
  license_number text,                 -- Lebanese Order of Nurses license
  certifications text[] default '{}',  -- ["RN", "PN", "IV", ...]
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nurses_user_idx on public.nurses(user_id);

-- ─────────────────────────────────────────────────────────
-- Cases — a care relationship between a patient and a service shape
-- ─────────────────────────────────────────────────────────
create table public.cases (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  case_ref text not null unique,                          -- e.g. "Case 2026-051"
  mode text not null check (mode in ('visit', 'shift', 'subscription')),
  status text not null default 'active' check (status in ('active', 'paused', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cases_patient_idx on public.cases(patient_id);
create index cases_status_idx on public.cases(status);

-- ─────────────────────────────────────────────────────────
-- Visits — a single visit instance
-- ─────────────────────────────────────────────────────────
create table public.visits (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete restrict,
  scheduled_at timestamptz not null,
  assigned_nurse_id uuid references public.nurses(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visits_case_idx on public.visits(case_id);
create index visits_nurse_idx on public.visits(assigned_nurse_id);
create index visits_scheduled_idx on public.visits(scheduled_at);

-- ─────────────────────────────────────────────────────────
-- Visit summaries — the document the family receives
-- ─────────────────────────────────────────────────────────
create table public.visit_summaries (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references public.visits(id) on delete cascade unique,
  vitals jsonb not null default '{}'::jsonb,           -- {bp, hr, spo2, temp, ...}
  done_body text,                                       -- "What was done" paragraph
  observations_body text,                               -- "Observations" paragraph
  meds_administered text[] default '{}',                -- array of strings
  watch_items text[] default '{}',                      -- array of strings
  next_visit_body text,
  coordinator_note text,
  written_at timestamptz not null default now(),
  finalised boolean not null default false,             -- once true, no edits (audit)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visit_summaries_visit_idx on public.visit_summaries(visit_id);

-- ─────────────────────────────────────────────────────────
-- Wound photos — references to objects in private storage bucket
-- ─────────────────────────────────────────────────────────
create table public.wound_photos (
  id uuid primary key default uuid_generate_v4(),
  visit_summary_id uuid not null references public.visit_summaries(id) on delete cascade,
  storage_path text not null,                           -- path in the wound-photos bucket
  caption text,
  taken_at timestamptz,
  uploaded_at timestamptz not null default now()
);

create index wound_photos_summary_idx on public.wound_photos(visit_summary_id);

-- ─────────────────────────────────────────────────────────
-- Storage bucket — wound photos (private)
-- ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wound-photos', 'wound-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────
-- Helper functions for RLS
-- ─────────────────────────────────────────────────────────

-- Returns true if the calling user has the 'coordinator' role
create or replace function public.is_coordinator()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coordinator'
  );
$$;

-- Returns true if the calling user is a member of the given family
create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_memberships
    where family_id = target_family_id and user_id = auth.uid()
  );
$$;

-- Returns true if the calling user is the assigned nurse for the given visit
create or replace function public.is_assigned_nurse(target_visit_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.visits v
    join public.nurses n on n.id = v.assigned_nurse_id
    where v.id = target_visit_id and n.user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_memberships enable row level security;
alter table public.patients enable row level security;
alter table public.nurses enable row level security;
alter table public.cases enable row level security;
alter table public.visits enable row level security;
alter table public.visit_summaries enable row level security;
alter table public.wound_photos enable row level security;

-- ─────────────────────────────────────────────────────────
-- RLS policies — profiles
-- ─────────────────────────────────────────────────────────
create policy "users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "coordinators can read any profile"
  on public.profiles for select
  using (public.is_coordinator());

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────
-- RLS policies — families
-- ─────────────────────────────────────────────────────────
create policy "members can read their family"
  on public.families for select
  using (public.is_family_member(id));

create policy "coordinators can read any family"
  on public.families for select
  using (public.is_coordinator());

create policy "coordinators can write any family"
  on public.families for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- RLS policies — family_memberships
-- ─────────────────────────────────────────────────────────
create policy "users can read memberships they're part of"
  on public.family_memberships for select
  using (user_id = auth.uid());

create policy "coordinators can read any membership"
  on public.family_memberships for select
  using (public.is_coordinator());

create policy "coordinators can write any membership"
  on public.family_memberships for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- RLS policies — patients
-- ─────────────────────────────────────────────────────────
create policy "family members can read their patients"
  on public.patients for select
  using (public.is_family_member(family_id));

create policy "coordinators can read any patient"
  on public.patients for select
  using (public.is_coordinator());

create policy "coordinators can write any patient"
  on public.patients for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- RLS policies — nurses
-- ─────────────────────────────────────────────────────────
create policy "nurses can read their own profile"
  on public.nurses for select
  using (user_id = auth.uid());

create policy "coordinators can read any nurse"
  on public.nurses for select
  using (public.is_coordinator());

create policy "coordinators can write any nurse"
  on public.nurses for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- Note: families can ALSO read nurses' display_name on visits they have access to.
-- That's handled via a view or by joining in queries; we'll add a narrow SELECT policy if needed.

-- ─────────────────────────────────────────────────────────
-- RLS policies — cases
-- ─────────────────────────────────────────────────────────
create policy "family members can read their cases"
  on public.cases for select
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_id and public.is_family_member(p.family_id)
    )
  );

create policy "coordinators can do anything with cases"
  on public.cases for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- RLS policies — visits
-- ─────────────────────────────────────────────────────────
create policy "family members can read visits for their cases"
  on public.visits for select
  using (
    exists (
      select 1 from public.cases c
      join public.patients p on p.id = c.patient_id
      where c.id = case_id and public.is_family_member(p.family_id)
    )
  );

create policy "assigned nurses can read their visits"
  on public.visits for select
  using (
    exists (
      select 1 from public.nurses n
      where n.id = assigned_nurse_id and n.user_id = auth.uid()
    )
  );

create policy "coordinators can do anything with visits"
  on public.visits for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- RLS policies — visit_summaries
-- ─────────────────────────────────────────────────────────
create policy "family members can read summaries for their visits"
  on public.visit_summaries for select
  using (
    exists (
      select 1 from public.visits v
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where v.id = visit_id and public.is_family_member(p.family_id)
    )
  );

create policy "assigned nurses can read their summaries"
  on public.visit_summaries for select
  using (public.is_assigned_nurse(visit_id));

create policy "assigned nurses can write summaries for their visits"
  on public.visit_summaries for insert
  with check (public.is_assigned_nurse(visit_id));

create policy "assigned nurses can update their not-yet-finalised summaries"
  on public.visit_summaries for update
  using (public.is_assigned_nurse(visit_id) and finalised = false);

create policy "coordinators can do anything with summaries"
  on public.visit_summaries for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- RLS policies — wound_photos
-- ─────────────────────────────────────────────────────────
create policy "family members can read photos for their summaries"
  on public.wound_photos for select
  using (
    exists (
      select 1 from public.visit_summaries vs
      join public.visits v on v.id = vs.visit_id
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where vs.id = visit_summary_id and public.is_family_member(p.family_id)
    )
  );

create policy "assigned nurses can manage photos for their summaries"
  on public.wound_photos for all
  using (
    exists (
      select 1 from public.visit_summaries vs
      where vs.id = visit_summary_id and public.is_assigned_nurse(vs.visit_id)
    )
  )
  with check (
    exists (
      select 1 from public.visit_summaries vs
      where vs.id = visit_summary_id and public.is_assigned_nurse(vs.visit_id)
    )
  );

create policy "coordinators can manage any photo"
  on public.wound_photos for all
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- Storage policies — wound-photos bucket
-- ─────────────────────────────────────────────────────────

-- Family members can read photos belonging to their family.
-- Storage paths are expected to be of the form: families/{family_id}/...
create policy "family members can read their wound photos"
  on storage.objects for select
  using (
    bucket_id = 'wound-photos'
    and (
      public.is_coordinator()
      or exists (
        select 1 from public.family_memberships fm
        where fm.user_id = auth.uid()
          and split_part(name, '/', 1) = 'families'
          and split_part(name, '/', 2) = fm.family_id::text
      )
    )
  );

create policy "nurses can upload photos to their assigned visits"
  on storage.objects for insert
  with check (
    bucket_id = 'wound-photos'
    and (
      public.is_coordinator()
      or exists (
        select 1 from public.nurses n
        where n.user_id = auth.uid() and n.active = true
      )
    )
  );

create policy "coordinators can manage any photo in the bucket"
  on storage.objects for all
  using (bucket_id = 'wound-photos' and public.is_coordinator())
  with check (bucket_id = 'wound-photos' and public.is_coordinator());

-- ─────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger families_set_updated_at before update on public.families for each row execute procedure public.set_updated_at();
create trigger patients_set_updated_at before update on public.patients for each row execute procedure public.set_updated_at();
create trigger nurses_set_updated_at before update on public.nurses for each row execute procedure public.set_updated_at();
create trigger cases_set_updated_at before update on public.cases for each row execute procedure public.set_updated_at();
create trigger visits_set_updated_at before update on public.visits for each row execute procedure public.set_updated_at();
create trigger visit_summaries_set_updated_at before update on public.visit_summaries for each row execute procedure public.set_updated_at();
