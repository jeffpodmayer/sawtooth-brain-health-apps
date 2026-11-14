-- Skipping a step (ADR-055). A test can declare steps a clinician may skip, such as Trail Making's Part A
-- when the client can't complete Sample A (NACC: Part A not given, code 996, and Sample B is still given).
-- The skip is saved on the test's row before the client's tab acts on it, like a stop or Continue (ADR-049).
-- Shared code never learns a test's steps: the skip is a key the test chose ('partA') and hold numbers.

-- 1. The skip's key, or empty. Set only by request_skip below; the client's tab reads it through check-status.
alter table public.sequence_tests
  add column skip_requested text;

-- 2. The lock on finished rows, replaced. Everything from allow_hold_reset stays, plus one rule:
--    a skip, once requested, never changes, except that the reset when a link is reopened (ADR-053)
--    clears it together with the holds, since the test starts again from its beginning.
create or replace function public.protect_finished_sequence_test()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'pending' then
    raise exception 'A finished test can''t be changed';
  end if;

  if old.stop_requested_at is not null
    and (new.stop_requested_at is distinct from old.stop_requested_at
      or new.stop_reason is distinct from old.stop_reason
      or new.stopped_by is distinct from old.stopped_by) then
    raise exception 'A stop can''t be changed once requested';
  end if;

  if (new.holds_reached < old.holds_reached or new.holds_released < old.holds_released)
    and not (new.holds_reached = 0 and new.holds_released = 0 and old.stop_requested_at is null) then
    raise exception 'A hold can''t be undone, except by a reset to 0 before any stop';
  end if;

  if old.skip_requested is not null
    and new.skip_requested is distinct from old.skip_requested
    and not (new.skip_requested is null and new.holds_reached = 0 and new.holds_released = 0) then
    raise exception 'A skip can''t be changed once requested, except by a reset';
  end if;

  return new;
end;
$$;

-- 3. Skip: a clinician skips the running test's step. The test's own plug-in says when its skip is
--    allowed (while_released: how many holds Continue has released) and where it lands (to_hold: the hold
--    the test waits at next). The hold counts move up to just before to_hold, so the tab's next report
--    fits, and Continue then starts the step at to_hold. Asking twice changes nothing.
create function public.request_skip(sequence_test_id uuid, skip text, while_released integer, to_hold integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_practice_id uuid := private.current_practice_id();
begin
  if caller_practice_id is null then
    raise exception 'Only a clinician can skip a step' using errcode = '42501';
  end if;

  if skip is null or skip !~ '^[A-Za-z]{1,40}$' or to_hold - 1 <= while_released then
    raise exception 'Not a skip a test could declare' using errcode = '22023';
  end if;

  update public.sequence_tests as test
  set skip_requested = skip,
      holds_reached = to_hold - 1,
      holds_released = to_hold - 1
  where test.id = sequence_test_id
    and test.practice_id = caller_practice_id
    and test.status = 'pending'
    and test.stop_requested_at is null
    and test.skip_requested is null
    and test.holds_released = while_released;
end;
$$;

-- Signed-in clinicians only. Postgres lets everyone run a new function unless told otherwise.
revoke execute on function public.request_skip(uuid, text, integer, integer) from public, anon;
grant execute on function public.request_skip(uuid, text, integer, integer) to authenticated;
