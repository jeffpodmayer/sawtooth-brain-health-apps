-- create_sequence: a clinician creates a client's visit in one step (roadmap 8.4a, ADR-044).
-- Finds the client code, or adds it if it's new, then creates the sequence and its tests.
-- It all runs in one transaction: every row saves, or none does.

create function public.create_sequence(client_code text, test_ids text[])
returns table (link_token text, client_is_new boolean, client_created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- The practice comes from the sign-in, never from the caller.
  caller_practice_id uuid := private.current_practice_id();
  found_client_id uuid;
  new_sequence_id uuid;
begin
  -- Only a signed-in clinician has a practice.
  if caller_practice_id is null then
    raise exception 'Only a clinician can create a sequence' using errcode = '42501';
  end if;

  -- A sequence needs at least one test.
  if coalesce(cardinality(test_ids), 0) = 0 then
    raise exception 'A sequence needs at least one test' using errcode = '22023';
  end if;

  -- Add the client if the code is new. If it already exists, nothing is added.
  insert into public.clients (practice_id, code)
  values (caller_practice_id, client_code)
  on conflict (practice_id, code) do nothing
  returning id, created_at into found_client_id, client_created_at;

  client_is_new := found_client_id is not null;

  -- An existing client: look them up in this practice.
  if not client_is_new then
    select id, created_at into found_client_id, client_created_at
    from public.clients
    where practice_id = caller_practice_id and code = client_code;
  end if;

  -- The sequence. The database makes the link token and sets the status to open.
  insert into public.sequences (practice_id, client_id, created_by)
  values (caller_practice_id, found_client_id, (select auth.uid()))
  returning id, sequences.link_token into new_sequence_id, link_token;

  -- One pending row per test, in the order given (1, 2, …).
  insert into public.sequence_tests (practice_id, sequence_id, test_id, position)
  select caller_practice_id, new_sequence_id, given.test_id, given.position
  from unnest(test_ids) with ordinality as given (test_id, position);

  return next;
end;
$$;

-- Signed-in clinicians only. Postgres lets everyone run a new function unless told otherwise.
revoke execute on function public.create_sequence(text, text[]) from public, anon;
grant execute on function public.create_sequence(text, text[]) to authenticated;
