-- A skip stays offered through the step it skips (ADR-055, changed the same day): Trail Making's Skip Part A
-- works during Sample A, the wait before Part A, and Part A itself, until Part A finishes.

-- 1. request_skip, replaced. The caller now passes how many holds are released right now (1 during Sample A
--    and the wait after it, 2 during Part A), and the skip is refused once the test has reached the hold it
--    lands at (to_hold), since by then the skipped step is over. Everything else is unchanged.
create or replace function public.request_skip(sequence_test_id uuid, skip text, while_released integer, to_hold integer)
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

  if skip is null or skip !~ '^[A-Za-z]{1,40}$' or to_hold - 1 < while_released then
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
    and test.holds_released = while_released
    and test.holds_reached < to_hold;
end;
$$;

-- 2. The ping to the client's tab, replaced: a skip sends "check now" too. During Part A the hold counts
--    are already where the skip puts them, so they don't change, and without this the tab would only hear
--    of the skip at its next status check (a few seconds).
drop trigger ping_visit_on_test_change on public.sequence_tests;
create trigger ping_visit_on_test_change
after update on public.sequence_tests
for each row
when (
  (old.stop_requested_at is null and new.stop_requested_at is not null)
  or new.holds_released <> old.holds_released
  or (old.skip_requested is null and new.skip_requested is not null)
)
execute function private.ping_visit();
