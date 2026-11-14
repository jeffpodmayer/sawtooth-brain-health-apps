-- "Check now" pings to the client's tab (roadmap 9.3, ADR-051).
-- When a clinician stops a test, clicks Continue, or a visit closes, an empty message goes out on that
-- visit's own real-time channel. The message carries no data: the tab then asks an Edge Function for the state.

-- 1. A visit's channel name: "visit:" and a one-way hash of its link token with a fixed prefix.
--    The client's tab works out the same name from the token in its address.
create function private.visit_channel(link_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'visit:' || encode(pg_catalog.sha256(convert_to('sawtooth-visit:' || link_token, 'UTF8')), 'hex');
$$;

-- 2. Sends the ping. Used by both triggers below; each passes the visit's ID.
--    realtime.send never raises an error (it only logs a warning), so a failed ping can't block a stop or Continue.
create function private.ping_visit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  visit_id uuid;
  token text;
begin
  -- Separate lines, since a sequences row has no sequence_id field (naming it fails even in an unused branch).
  if tg_table_name = 'sequences' then
    visit_id := new.id;
  else
    visit_id := new.sequence_id;
  end if;

  select visit.link_token into token from public.sequences as visit where visit.id = visit_id;

  perform realtime.send('{}'::jsonb, 'check', private.visit_channel(token), false);
  return null;
end;
$$;

-- 3. On a test: a stop is requested, or Continue releases a hold.
create trigger ping_visit_on_test_change
after update on public.sequence_tests
for each row
when (
  (old.stop_requested_at is null and new.stop_requested_at is not null)
  or new.holds_released <> old.holds_released
)
execute function private.ping_visit();

-- 4. On a visit: it closes (End whole sequence, or the last test finishing).
create trigger ping_visit_on_close
after update on public.sequences
for each row
when (old.status = 'open' and new.status <> 'open')
execute function private.ping_visit();
