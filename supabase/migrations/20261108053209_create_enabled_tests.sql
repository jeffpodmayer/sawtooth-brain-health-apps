-- Enabled tests: which tests each practice may use (ADR-003).
-- One row per practice per test, e.g. Sawtooth + swaps. Licensing decides
-- what's enabled (SWAPS permission is per practice, ADR-010).

create table public.enabled_tests (
  practice_id uuid not null references public.practices (id) on delete restrict,
  test_id text not null,
  created_at timestamptz not null default now(),

  -- The pair is the row's identity, so a test can't be enabled twice in one practice.
  primary key (practice_id, test_id),

  -- Only tests that exist in the app (the folder names in src/tests/).
  -- Adding a new test means adding its id here in a new migration.
  constraint enabled_tests_test_id_check check (test_id in ('trail-making', 'swaps'))
);

-- No separate index on practice_id: the primary key's index starts with it.

-- Locked from the start (ADR-021). Policies are added in roadmap 2.7.
alter table public.enabled_tests enable row level security;
