-- Shareable summary links (Option C): unguessable, expiring, no-login access to
-- ONE published visit summary. The public page reads this via the service-role
-- admin client (no anon RLS policy), so access is gated entirely in app code:
-- token must exist, be unexpired, and point to a published summary.

create table if not exists public.summary_share_links (
  id uuid primary key default uuid_generate_v4(),
  token text not null unique,
  visit_summary_id uuid not null references public.visit_summaries(id) on delete cascade,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists summary_share_links_token_idx on public.summary_share_links(token);
create index if not exists summary_share_links_summary_idx on public.summary_share_links(visit_summary_id);

alter table public.summary_share_links enable row level security;

-- Coordinators manage links (create + read to re-display). No anon/family policy:
-- the public /s/<token> page uses the admin client, not RLS.
drop policy if exists "coordinators manage share links" on public.summary_share_links;
create policy "coordinators manage share links"
  on public.summary_share_links for all
  using (public.is_coordinator())
  with check (public.is_coordinator());
