-- Clinicians stop, end and continue a visit's tests (roadmap 9.1, ADR-048, ADR-049).
-- Plus two columns the client's tab will fill (9.3) so the dashboard can show the running test.

-- 1. When the client's tab began the test, and when the current timed part started (cleared when it ends).
--    Set by the server's clock, through Edge Functions. Display only; never part of the result.
alter table public.sequence_tests
  add column began_at timestamptz,
  add column timed_part_started_at timestamptz,
  add constraint sequence_tests_timed_part_check
    check (timed_part_started_at is null or began_at is not null);

-- 2. End current test: puts a stop request on the visit's running test.
--    The running test is the first pending test in an open visit. The client's tab answers it (ADR-049).
create function public.request_test_stop(sequence_test_id uuid, reason text)
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
      stopped_by = (select auth.uid())
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

-- 3. End whole sequence, in one save (ADR-049): the visit closes first, so the close trigger
--    can't mark it completed; then the running test gets a stop request; then the rest are not given.
create function public.end_sequence(sequence_id uuid, reason text)
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

  -- Close the visit. Only an open visit in the caller's practice matches.
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

-- 4. Continue: releases every hold the client's tab has reached. Clicking twice changes nothing.
create function public.continue_test(sequence_test_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_practice_id uuid := private.current_practice_id();
begin
  if caller_practice_id is null then
    raise exception 'Only a clinician can continue a test' using errcode = '42501';
  end if;

  update public.sequence_tests as test
  set holds_released = test.holds_reached
  where test.id = sequence_test_id
    and test.practice_id = caller_practice_id
    and test.status = 'pending'
    and test.stop_requested_at is null
    and test.holds_reached > test.holds_released;
end;
$$;

-- Signed-in clinicians only. Postgres lets everyone run a new function unless told otherwise.
revoke execute on function public.request_test_stop(uuid, text) from public, anon;
revoke execute on function public.end_sequence(uuid, text) from public, anon;
revoke execute on function public.continue_test(uuid) from public, anon;
grant execute on function public.request_test_stop(uuid, text) to authenticated;
grant execute on function public.end_sequence(uuid, text) to authenticated;
grant execute on function public.continue_test(uuid) to authenticated;
