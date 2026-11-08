-- Clinicians: one row per clinician login (ADR-003).
-- Links a Supabase login (auth.users) to exactly one practice.

create table public.clinicians (
  id uuid primary key references auth.users (id) on delete restrict,
  practice_id uuid not null references public.practices (id) on delete restrict,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Postgres doesn't index foreign key columns on its own.
-- Every RLS check (2.7) will look clinicians up by practice.
create index clinicians_practice_id_idx on public.clinicians (practice_id);

-- Locked from the start (ADR-021). Policies are added in roadmap 2.7.
alter table public.clinicians enable row level security;
