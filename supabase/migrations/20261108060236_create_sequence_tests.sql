-- Sequence tests: one row per test in a sequence, in order (ADR-008).
-- Created as 'pending' with the sequence; the result columns are filled once,
-- when the test completes or a clinician stops it.

-- The composite foreign key below needs a unique rule on (id, practice_id) to point at.
-- id is already unique on its own, so this never rejects anything new.
alter table public.sequences
  add constraint sequences_id_practice_id_key unique (id, practice_id);

create table public.sequence_tests (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete restrict,
  sequence_id uuid not null,
  test_id text not null,

  -- Order within the sequence: 1 is the first test given.
  position integer not null,

  status text not null default 'pending',

  -- The result, from onComplete (ADR-001). Empty until the test ran.
  test_version text,
  started_at timestamptz,
  completed_at timestamptz,
  scores jsonb,
  raw_data jsonb,

  -- Size of the test area in full screen, in CSS pixels (ADR-005).
  -- Measured by the shared layer, not the test.
  screen_width integer,
  screen_height integer,

  -- Set only when a clinician stopped the test (ADR-009).
  stop_reason text,
  stopped_by uuid,

  created_at timestamptz not null default now(),

  -- The sequence, the test and the clinician must all belong to this row's practice (ADR-023).
  constraint sequence_tests_sequence_fkey foreign key (sequence_id, practice_id)
    references public.sequences (id, practice_id) on delete restrict,
  constraint sequence_tests_test_fkey foreign key (practice_id, test_id)
    references public.enabled_tests (practice_id, test_id) on delete restrict,
  constraint sequence_tests_stopped_by_fkey foreign key (stopped_by, practice_id)
    references public.clinicians (id, practice_id) on delete restrict,

  -- No two tests share a position, and each test appears at most once per sequence.
  constraint sequence_tests_sequence_id_position_key unique (sequence_id, position),
  constraint sequence_tests_sequence_id_test_id_key unique (sequence_id, test_id),

  constraint sequence_tests_position_check check (position >= 1),

  -- pending: not given yet. completed: the test ran to its end (timeouts included).
  -- stopped: a clinician ended it partway (9.1). not_given: the sequence ended before it was reached.
  constraint sequence_tests_status_check
    check (status in ('pending', 'completed', 'stopped', 'not_given')),

  -- Why a clinician stopped the test (ADR-009: more can be added).
  constraint sequence_tests_stop_reason_check
    check (stop_reason in ('gave_up', 'interrupted', 'unable_to_complete')),

  constraint sequence_tests_screen_size_check
    check (screen_width > 0 and screen_height > 0),

  -- A result exists exactly when the test ran (completed or stopped).
  constraint sequence_tests_result_check check (
    (status in ('completed', 'stopped')
      and test_version is not null and started_at is not null
      and completed_at is not null and scores is not null and raw_data is not null
      and screen_width is not null and screen_height is not null)
    or
    (status in ('pending', 'not_given')
      and test_version is null and started_at is null
      and completed_at is null and scores is null and raw_data is null
      and screen_width is null and screen_height is null)
  ),

  -- A reason and a clinician exactly when the test was stopped.
  constraint sequence_tests_stop_check check (
    (status = 'stopped' and stop_reason is not null and stopped_by is not null)
    or
    (status <> 'stopped' and stop_reason is null and stopped_by is null)
  )
);

-- Foreign key columns get an index (ADR-022).
-- No separate index on sequence_id: the (sequence_id, position) unique rule's index starts with it.
-- No separate index on practice_id: the (practice_id, test_id) index below starts with it.
create index sequence_tests_practice_id_test_id_idx on public.sequence_tests (practice_id, test_id);
create index sequence_tests_stopped_by_idx on public.sequence_tests (stopped_by);

-- Locked from the start (ADR-021). Policies are added in roadmap 2.7.
alter table public.sequence_tests enable row level security;
