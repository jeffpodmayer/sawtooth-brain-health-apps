-- A sequence closes by itself once none of its tests is pending (roadmap 7.8, ADR-042).
-- Fixed at roadmap 9.5 (Phases 5–7 code review): two saves finishing a visit's last two tests at the
-- same moment could each still see the other's test as pending, so neither closed the visit.
-- Now each save first locks the visit's row. The second save waits until the first is saved, then
-- looks again and sees it, so the last one to finish always closes the visit.

create or replace function public.close_finished_sequence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Wait for any other save on this visit to finish. The check below then sees its change.
  perform 1
  from public.sequences
  where id = new.sequence_id
  for update;

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
