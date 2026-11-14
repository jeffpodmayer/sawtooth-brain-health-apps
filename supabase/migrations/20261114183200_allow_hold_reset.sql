-- A reopened link resets the running test's holds (ADR-053, changes ADR-049).
-- After a reload the test starts again from its beginning (ADR-036), so check-link puts its holds
-- back to 0. The lock on finished rows allows that one drop: both counts to 0 together, and only
-- while no stop is requested. Every other rule is unchanged.

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

  return new;
end;
$$;
