-- A sequence closes by itself once none of its tests is pending (roadmap 7.8).
-- This runs inside the save that finished the last test, so a saved last test
-- and a closed link always go together: both happen, or neither does.

create function public.close_finished_sequence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.sequence_tests
    where sequence_id = new.sequence_id
      and status = 'pending'
  ) then
    update public.sequences
    set status = 'completed'
    where id = new.sequence_id
      and status = 'open';
  end if;

  return null;
end;
$$;

create trigger close_finished_sequence
  after update of status on public.sequence_tests
  for each row
  when (old.status = 'pending' and new.status <> 'pending')
  execute function public.close_finished_sequence();
