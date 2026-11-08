-- Practices: one row per clinic using the app (ADR-003).
-- Every other table points here with practice_id.

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Locked from the start. Policies are added in roadmap 2.7.
alter table public.practices enable row level security;
