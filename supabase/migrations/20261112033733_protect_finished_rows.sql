-- Results are never overwritten and a closed sequence never reopens (ADR-008).
-- A test can't end before it started (Phase 2 code review).

-- A test can't end before it started.
-- Rows with no result yet have both times empty, and an empty comparison passes a check.
alter table public.sequence_tests
  add constraint sequence_tests_times_check check (completed_at >= started_at);

-- Once a test has a result, or was marked not given, its row never changes again.
create function public.protect_finished_sequence_test()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'pending' then
    raise exception 'A finished test can''t be changed';
  end if;

  return new;
end;
$$;

create trigger protect_finished_sequence_test
  before update on public.sequence_tests
  for each row
  execute function public.protect_finished_sequence_test();

-- Once a sequence is completed or discontinued, its row never changes again,
-- so its link can't start working again.
create function public.protect_closed_sequence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'open' then
    raise exception 'A closed sequence can''t be changed';
  end if;

  return new;
end;
$$;

create trigger protect_closed_sequence
  before update on public.sequences
  for each row
  execute function public.protect_closed_sequence();
