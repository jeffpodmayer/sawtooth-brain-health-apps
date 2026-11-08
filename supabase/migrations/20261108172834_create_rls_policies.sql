-- Row-level security policies: clinicians see their own practice only (ADR-003).
-- Clients have no policies: everything they do goes through Edge Functions (ADR-002).

-- Kept out of public so the helper can't be called through the API.
create schema private;
grant usage on schema private to authenticated;

-- The signed-in clinician's practice, or nothing if they aren't a clinician.
-- security definer: it must read clinicians, whose own policy calls this function.
create function private.current_practice_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select practice_id from public.clinicians where id = (select auth.uid());
$$;

revoke execute on function private.current_practice_id() from public;
grant execute on function private.current_practice_id() to authenticated;

-- A policy only narrows what a role is already allowed to do, so grant that first.
grant select on public.practices to authenticated;
grant select on public.clinicians to authenticated;
grant select, insert on public.clients to authenticated;
grant select on public.enabled_tests to authenticated;
grant select on public.sequences to authenticated;
grant select on public.sequence_tests to authenticated;
grant select, insert, update, delete on public.sequence_test_notes to authenticated;

-- Read-only tables, limited to the clinician's own practice.
-- (select ...) makes Postgres look the practice up once per query, not once per row.
create policy practices_select on public.practices
  for select to authenticated
  using (id = (select private.current_practice_id()));

create policy clinicians_select on public.clinicians
  for select to authenticated
  using (practice_id = (select private.current_practice_id()));

create policy enabled_tests_select on public.enabled_tests
  for select to authenticated
  using (practice_id = (select private.current_practice_id()));

create policy sequences_select on public.sequences
  for select to authenticated
  using (practice_id = (select private.current_practice_id()));

create policy sequence_tests_select on public.sequence_tests
  for select to authenticated
  using (practice_id = (select private.current_practice_id()));

-- Clients can be read and added, but codes are permanent (ADR-008).
create policy clients_select on public.clients
  for select to authenticated
  using (practice_id = (select private.current_practice_id()));

create policy clients_insert on public.clients
  for insert to authenticated
  with check (practice_id = (select private.current_practice_id()));

-- Notes: everyone in the practice reads them; only the author edits or deletes (ADR-025).
create policy sequence_test_notes_select on public.sequence_test_notes
  for select to authenticated
  using (practice_id = (select private.current_practice_id()));

create policy sequence_test_notes_insert on public.sequence_test_notes
  for insert to authenticated
  with check (
    practice_id = (select private.current_practice_id())
    and created_by = (select auth.uid())
  );

create policy sequence_test_notes_update on public.sequence_test_notes
  for update to authenticated
  using (
    practice_id = (select private.current_practice_id())
    and created_by = (select auth.uid())
  )
  with check (
    practice_id = (select private.current_practice_id())
    and created_by = (select auth.uid())
  );

create policy sequence_test_notes_delete on public.sequence_test_notes
  for delete to authenticated
  using (
    practice_id = (select private.current_practice_id())
    and created_by = (select auth.uid())
  );
