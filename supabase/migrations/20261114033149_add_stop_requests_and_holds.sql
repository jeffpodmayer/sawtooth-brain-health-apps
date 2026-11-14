-- Stop requests and holds (roadmap 9.1, ADR-048, ADR-049).
-- A clinician's stop or Continue is saved on the test's row before the client's tab acts on it.

-- 1. The new columns.
alter table public.sequence_tests
  add column stop_requested_at timestamptz,
  add column holds_reached integer not null default 0,
  add column holds_released integer not null default 0;

-- 2. Rows already stopped (development's seed only) get a request time, so the new rule below fits them.
--    Finished rows are locked, so the lock is lifted for this one update and put straight back.
alter table public.sequence_tests disable trigger protect_finished_sequence_test;
update public.sequence_tests
set stop_requested_at = completed_at
where status = 'stopped';
alter table public.sequence_tests enable trigger protect_finished_sequence_test;

-- 3. Holds: Continue can't release more holds than the client has reached.
alter table public.sequence_tests
  add constraint sequence_tests_holds_check
    check (holds_released >= 0 and holds_released <= holds_reached);

-- 4. The stop rule, replaced. A request time, a reason and a clinician come together or not at all.
--    A stopped test always has them; a completed test never does; a pending or not-given test may.
alter table public.sequence_tests drop constraint sequence_tests_stop_check;
alter table public.sequence_tests
  add constraint sequence_tests_stop_check check (
    (stop_requested_at is null) = (stop_reason is null)
    and (stop_reason is null) = (stopped_by is null)
    and (status <> 'stopped' or stop_requested_at is not null)
    and (status <> 'completed' or stop_requested_at is null)
  );

-- 5. Trail Making's own reason joins the list (ADR-049).
alter table public.sequence_tests drop constraint sequence_tests_stop_reason_check;
alter table public.sequence_tests
  add constraint sequence_tests_stop_reason_check
    check (stop_reason in ('gave_up', 'interrupted', 'unable_to_complete', 'alphabet_check_not_passed'));

-- 6. The lock on finished rows also guards a pending row's stop and holds:
--    a stop, once requested, never changes, and neither count ever goes down.
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

  if new.holds_reached < old.holds_reached or new.holds_released < old.holds_released then
    raise exception 'A hold can''t be undone';
  end if;

  return new;
end;
$$;
