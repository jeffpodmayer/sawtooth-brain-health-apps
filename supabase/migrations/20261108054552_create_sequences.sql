-- Sequences: one row per client visit (ADR-001, ADR-008).
-- The client opens it with /t/<link_token>; the link works while status is 'open'.

-- gen_random_bytes lives in pgcrypto. Supabase installs it in the extensions
-- schema already; this line makes sure, so the migration also works on production.
create extension if not exists pgcrypto with schema extensions;

-- Composite foreign keys below need a unique rule on (id, practice_id) to point at.
-- id is already unique on its own, so these never reject anything new.
alter table public.clients
  add constraint clients_id_practice_id_key unique (id, practice_id);
alter table public.clinicians
  add constraint clinicians_id_practice_id_key unique (id, practice_id);

create table public.sequences (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete restrict,
  client_id uuid not null,
  created_by uuid not null,

  -- 32 random bytes as 64 hex characters: impossible to guess, safe in a URL.
  link_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),

  status text not null default 'open',
  created_at timestamptz not null default now(),

  -- The client and the clinician must both belong to this sequence's practice.
  constraint sequences_client_fkey foreign key (client_id, practice_id)
    references public.clients (id, practice_id) on delete restrict,
  constraint sequences_created_by_fkey foreign key (created_by, practice_id)
    references public.clinicians (id, practice_id) on delete restrict,

  -- Unique across the whole app, not just within a practice (ADR-003).
  constraint sequences_link_token_key unique (link_token),

  -- open: link works. completed: client finished (7.8). discontinued: a clinician ended it (9.1).
  constraint sequences_status_check check (status in ('open', 'completed', 'discontinued'))
);

-- Foreign key columns get an index (ADR-022).
create index sequences_practice_id_idx on public.sequences (practice_id);
create index sequences_client_id_idx on public.sequences (client_id);
create index sequences_created_by_idx on public.sequences (created_by);

-- Locked from the start (ADR-021). Policies are added in roadmap 2.7.
alter table public.sequences enable row level security;
