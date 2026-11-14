-- A stop on a test the client never began is settled at once (ADR-057, changes ADR-049).
-- The client's screen shows a test only after Continue releases its first hold (ADR-050), so while
-- holds_released is 0 the client hasn't seen any of it: the only possible answer is "not begun", which is
-- saved as not given. Settling it here means Discontinue and End session don't wait for a screen that may
-- never open. A stop on a test that began still waits for the client's screen, as before.

-- 1. Discontinue (End current test): the same as before, except that a test not begun is not given at once.
--    Its reason and clinician are kept. If it was the visit's last test, the close trigger completes the visit.
create or replace function public.request_test_stop(sequence_test_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_practice_id uuid := private.current_practice_id();
begin
  if caller_practice_id is null then
    raise exception 'Only a clinician can stop a test' using errcode = '42501';
  end if;

  update public.sequence_tests as test
  set stop_requested_at = now(),
      stop_reason = reason,
      stopped_by = (select auth.uid()),
      status = case when test.holds_released = 0 then 'not_given' else test.status end
  where test.id = sequence_test_id
    and test.practice_id = caller_practice_id
    and test.status = 'pending'
    and test.stop_requested_at is null
    -- Its visit is open, and no earlier test in it is still pending.
    and exists (
      select 1 from public.sequences as visit
      where visit.id = test.sequence_id and visit.status = 'open'
    )
    and not exists (
      select 1 from public.sequence_tests as earlier
      where earlier.sequence_id = test.sequence_id
        and earlier.status = 'pending'
        and earlier.position < test.position
    );

  if not found then
    raise exception 'This test isn''t running, or was already stopped' using errcode = 'P0002';
  end if;
end;
$$;

-- 2. End whole sequence: the same as in lock_tests_when_ending_sequence (locks in the same order as a save),
--    except that a running test not begun is not given at once, keeping the reason and clinician.
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

  -- Its stop request, unless one is already waiting. Not begun: not given at once.
  update public.sequence_tests as test
  set stop_requested_at = now(),
      stop_reason = reason,
      stopped_by = (select auth.uid()),
      status = case when test.holds_released = 0 then 'not_given' else test.status end
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
