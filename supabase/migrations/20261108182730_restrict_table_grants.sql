-- Table permissions, stated here so they don't depend on a Supabase project setting.
-- Without this, anon and authenticated start with full access and only RLS protects the data.

-- New tables start closed to the browser roles; each one must grant what it needs.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

revoke all on
  public.practices, public.clinicians, public.clients, public.enabled_tests,
  public.sequences, public.sequence_tests, public.sequence_test_notes
from anon, authenticated;

-- Edge Functions use service_role, so it must keep its access (ADR-002).
grant all on
  public.practices, public.clinicians, public.clients, public.enabled_tests,
  public.sequences, public.sequence_tests, public.sequence_test_notes
to service_role;

-- What clinicians may do. RLS then limits it to their own practice.
grant select on public.practices to authenticated;
grant select on public.clinicians to authenticated;
grant select on public.enabled_tests to authenticated;
grant select on public.sequences to authenticated;
grant select on public.sequence_tests to authenticated;
grant select, insert, update, delete on public.sequence_test_notes to authenticated;

-- Clients can be read and added. Only these two columns can be set; the database fills in the rest.
grant select on public.clients to authenticated;
grant insert (practice_id, code) on public.clients to authenticated;
