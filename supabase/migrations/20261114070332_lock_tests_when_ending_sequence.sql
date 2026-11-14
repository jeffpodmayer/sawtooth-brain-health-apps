-- End whole sequence takes its locks in the same order as a save (Phase 9 code review).
-- A save locks its test's row, then (in the close trigger, lock_sequence_when_closing) the visit's row.
-- end_sequence used to lock the visit first and then the tests, so a save and an End session at the same
-- moment could each wait for the other until Postgres cancelled one. Now end_sequence first locks the
-- visit's pending tests, waiting for any save in progress to finish, and only then closes the visit.
-- Otherwise the same as in add_clinician_stop_and_continue.

create or replace function public.end_sequence(sequence_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_practice_id uuid := private.current_practice_id();
  running_test_id uuid;
begin
  if caller_practice_id is null then
    raise exception 'Only a clinician can end a visit' using errcode = '42501';
  end if;

  -- Lock the visit's pending tests first, in the caller's practice only. If a save is finishing one,
  -- this waits for it, and a test it saved is no longer pending.
  perform 1
  from public.sequence_tests as test
  where test.sequence_id = end_sequence.sequence_id
    and test.practice_id = caller_practice_id
    and test.status = 'pending'
  order by test.position
  for update;

  -- Close the visit. Only an open visit in the caller's practice matches.
  -- A save that just finished the last test has already closed it, and this says so.
  update public.sequences as visit
  set status = 'discontinued'
  where visit.id = end_sequence.sequence_id
    and visit.practice_id = caller_practice_id
    and visit.status = 'open';

  if not found then
    raise exception 'This visit isn''t open' using errcode = 'P0002';
  end if;

  -- The running test: the first one still pending.
  select test.id into running_test_id
  from public.sequence_tests as test
  where test.sequence_id = end_sequence.sequence_id and test.status = 'pending'
  order by test.position
  limit 1;

  -- Its stop request, unless one is already waiting.
  update public.sequence_tests as test
  set stop_requested_at = now(),
      stop_reason = reason,
      stopped_by = (select auth.uid())
  where test.id = running_test_id
    and test.stop_requested_at is null;

  -- Every later test is not given.
  update public.sequence_tests as test
  set status = 'not_given'
  where test.sequence_id = end_sequence.sequence_id
    and test.status = 'pending'
    and test.id <> running_test_id;
end;
$$;
