-- Clients: one row per client code (ADR-003, ADR-008).
-- A code only, never a name or other details. Codes are unique within a practice.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete restrict,
  code text not null,
  created_at timestamptz not null default now(),

  -- Capital letters, digits and hyphens, 1-20 characters (e.g. C001, SBH-0042).
  -- No lowercase, so C001 and c001 can't both exist; no spaces, so a name is hard to type.
  constraint clients_code_format_check check (code ~ '^[A-Z0-9-]{1,20}$'),

  -- The same code can't appear twice in one practice, but another practice may use it.
  constraint clients_practice_id_code_key unique (practice_id, code)
);

-- No separate index on practice_id: the unique rule above already builds an
-- index that starts with practice_id, and Postgres uses it for lookups by practice.

-- Locked from the start (ADR-021). Policies are added in roadmap 2.7.
alter table public.clients enable row level security;
