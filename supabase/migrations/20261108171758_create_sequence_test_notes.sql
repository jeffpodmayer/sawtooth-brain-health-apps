-- Sequence test notes: clinicians' notes on one test in a sequence (ADR-008).
-- A test can have many notes. Each records who wrote it and when.

-- The composite foreign key below needs a unique rule on (id, practice_id) to point at.
-- id is already unique on its own, so this never rejects anything new.
alter table public.sequence_tests
  add constraint sequence_tests_id_practice_id_key unique (id, practice_id);

create table public.sequence_test_notes (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete restrict,
  sequence_test_id uuid not null,
  body text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),

  -- Empty until the note's text is first changed.
  updated_at timestamptz,

  -- The test and the clinician must both belong to this row's practice (ADR-023).
  constraint sequence_test_notes_sequence_test_fkey foreign key (sequence_test_id, practice_id)
    references public.sequence_tests (id, practice_id) on delete restrict,
  constraint sequence_test_notes_created_by_fkey foreign key (created_by, practice_id)
    references public.clinicians (id, practice_id) on delete restrict,

  -- A note must contain something other than spaces and blank lines.
  constraint sequence_test_notes_body_check check (body ~ '\S')
);

-- Foreign key columns get an index (ADR-022).
create index sequence_test_notes_practice_id_idx on public.sequence_test_notes (practice_id);
create index sequence_test_notes_sequence_test_id_idx on public.sequence_test_notes (sequence_test_id);
create index sequence_test_notes_created_by_idx on public.sequence_test_notes (created_by);

-- The database sets the times, and only a note's text can change.
create function public.protect_sequence_test_note()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := null;
    return new;
  end if;

  if new.id <> old.id
    or new.practice_id <> old.practice_id
    or new.sequence_test_id <> old.sequence_test_id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at then
    raise exception 'Only the text of a note can be changed';
  end if;

  new.updated_at := case when new.body <> old.body then now() else old.updated_at end;
  return new;
end;
$$;

create trigger protect_sequence_test_note
  before insert or update on public.sequence_test_notes
  for each row
  execute function public.protect_sequence_test_note();

-- Locked from the start (ADR-021). Policies are added in roadmap 2.7.
alter table public.sequence_test_notes enable row level security;
