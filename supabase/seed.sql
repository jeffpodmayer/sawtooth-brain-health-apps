-- Fake data for development only. Never run this on production (ADR-004).
-- Loaded automatically after a database reset, once the migrations have run.
-- Kept small for the clinicians' round (10.4): two Sawtooth clients with two visits each, showing the main
-- outcomes. All scores are made up. Each result's sheets are files in supabase/seed-sheets/, drawn by the tests'
-- own buildSheet to match these scores; SQL can't upload files, so after a reset run
-- `npx supabase seed buckets --remote=<development-ref> --yes` to put them in the sheets bucket.

-- Same ids as the first hand-made rows, so files in the sheets bucket stay in the right folders.
insert into public.practices (id, name)
values
  ('9fd7e9ef-8180-4ee6-b96a-b54143062035', 'Sawtooth Brain Health Institute'),
  ('4d5c949a-12ca-4902-b1fb-d73d7637f7e7', 'Fake Practice (dev only)');

-- A reset deletes all logins, so the seed makes them again. Real clinicians' logins are added by hand after a
-- reset (roadmap 10.4) and never go in this file.
-- The blank '' values are required: sign-in fails if those columns are empty (null).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', login.id, 'authenticated', 'authenticated', login.email,
  extensions.crypt('fake-dev-password', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
  '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'first-sawtooth@example.com'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'second-sawtooth@example.com'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'fake-clinician@example.com')
) as login (id, email);

-- Supabase's email sign-in also needs one identity row per login.
insert into auth.identities (user_id, provider_id, provider, identity_data, created_at, updated_at)
select id, id::text, 'email', jsonb_build_object('sub', id::text, 'email', email), now(), now()
from auth.users;

insert into public.clinicians (id, practice_id, display_name)
values
  ('10000000-0000-4000-8000-000000000001', '9fd7e9ef-8180-4ee6-b96a-b54143062035', 'Test Clinician One'),
  ('10000000-0000-4000-8000-000000000002', '9fd7e9ef-8180-4ee6-b96a-b54143062035', 'Test Clinician Two'),
  ('10000000-0000-4000-8000-000000000003', '4d5c949a-12ca-4902-b1fb-d73d7637f7e7', 'Fake Practice Clinician');

-- Sawtooth has both tests. Fake has Trail Making only, to test per-practice licensing.
insert into public.enabled_tests (practice_id, test_id)
values
  ('9fd7e9ef-8180-4ee6-b96a-b54143062035', 'trail-making'),
  ('9fd7e9ef-8180-4ee6-b96a-b54143062035', 'swaps'),
  ('4d5c949a-12ca-4902-b1fb-d73d7637f7e7', 'trail-making');

-- 1001 is in both practices on purpose: client IDs (four digits, ADR-054) are unique per practice, not across
-- the app. The Fake Practice's client has no visits; it is there to check that practices can't see each other.
insert into public.clients (id, practice_id, code)
values
  ('20000000-0000-4000-8000-000000000001', '9fd7e9ef-8180-4ee6-b96a-b54143062035', '1001'),
  ('20000000-0000-4000-8000-000000000002', '9fd7e9ef-8180-4ee6-b96a-b54143062035', '1002'),
  ('20000000-0000-4000-8000-000000000003', '4d5c949a-12ca-4902-b1fb-d73d7637f7e7', '1001');

-- Four Sawtooth visits. Finished tests are inserted already finished, so the trigger that closes a visit
-- (roadmap 7.8) never runs; finished visits are marked completed here. The open visit has a fixed fake link
-- token, so its link is the same after every reset (/t/ followed by 64 a's). Other tokens are filled in by the
-- database.
insert into public.sequences (id, practice_id, client_id, created_by, status, created_at, link_token)
values
  -- 1001, two weeks ago: both tests finished normally.
  ('30000000-0000-4000-8000-000000000001', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'completed', now() - interval '14 days', default),
  -- 1001, three days ago: Part B reached its time limit; SWAPS was discontinued.
  ('30000000-0000-4000-8000-000000000002', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'completed', now() - interval '3 days', default),
  -- 1002, a week ago: Part A skipped partway (996); SWAPS finished with one recall blank.
  ('30000000-0000-4000-8000-000000000003', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
   'completed', now() - interval '7 days', default),
  -- 1002, today: open, both tests waiting.
  ('30000000-0000-4000-8000-000000000004', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   'open', now() - interval '5 minutes', repeat('a', 64));

-- Finished results that ran to the end (no stop): Trail Making and SWAPS in each finished visit.
insert into public.sequence_tests (
  id, practice_id, sequence_id, test_id, position, status, test_version,
  started_at, completed_at, scores, raw_data, screen_width, screen_height, sheets, skip_requested
)
values
  -- Visit 1: both Trail Making parts completed.
  ('40000000-0000-4000-8000-000000000001', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '30000000-0000-4000-8000-000000000001', 'trail-making', 1, 'completed', '0.0.0-seed',
   now() - interval '14 days' + interval '5 minutes', now() - interval '14 days' + interval '15 minutes',
   '{
     "sampleA": {"passed": true, "timeMs": 21400, "timeSeconds": 21.4, "correctLines": 7, "correctClicks": 8, "errors": 0},
     "partA": {"status": "completed", "code": null, "timeMs": 42300, "timeSeconds": 42.3, "correctLines": 24, "correctClicks": 25, "errors": 0},
     "sampleB": {"passed": true, "timeMs": 30800, "timeSeconds": 30.8, "correctLines": 7, "correctClicks": 8, "errors": 1},
     "partB": {"status": "completed", "code": null, "timeMs": 97600, "timeSeconds": 97.6, "correctLines": 24, "correctClicks": 25, "errors": 2}
   }',
   '{"seed": true}', 1440, 900, '{"sampleA": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000001/seed/sampleA.svg", "partA": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000001/seed/partA.svg", "sampleB": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000001/seed/sampleB.svg", "partB": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000001/seed/partB.svg"}', null),

  -- Visit 1: SWAPS to its time limit, then a full recall.
  ('40000000-0000-4000-8000-000000000002', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '30000000-0000-4000-8000-000000000001', 'swaps', 2, 'completed', '0.0.0-seed',
   now() - interval '14 days' + interval '17 minutes', now() - interval '14 days' + interval '22 minutes',
   '{
     "test": {"status": "timedOut", "timeMs": 60000, "attempted": 38, "correct": 36, "errors": 2, "corrections": 1},
     "recall": {"status": "completed", "correct": 6, "blank": 0},
     "practice": {"wrongAnswers": 0}
   }',
   '{"seed": true}', 1440, 900, '{"sheet": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000002/seed/sheet.svg"}', null),

  -- Visit 2: Part A completed, Part B reached its 300-second limit.
  ('40000000-0000-4000-8000-000000000003', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '30000000-0000-4000-8000-000000000002', 'trail-making', 1, 'completed', '0.0.0-seed',
   now() - interval '3 days' + interval '5 minutes', now() - interval '3 days' + interval '18 minutes',
   '{
     "sampleA": {"passed": true, "timeMs": 25100, "timeSeconds": 25.1, "correctLines": 7, "correctClicks": 8, "errors": 0},
     "partA": {"status": "completed", "code": null, "timeMs": 39100, "timeSeconds": 39.1, "correctLines": 24, "correctClicks": 25, "errors": 1},
     "sampleB": {"passed": true, "timeMs": 44600, "timeSeconds": 44.6, "correctLines": 7, "correctClicks": 8, "errors": 2},
     "partB": {"status": "timedOut", "code": null, "timeMs": 300000, "timeSeconds": 300, "correctLines": 17, "correctClicks": 18, "errors": 3}
   }',
   '{"seed": true}', 1440, 900, '{"sampleA": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000003/seed/sampleA.svg", "partA": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000003/seed/partA.svg", "sampleB": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000003/seed/sampleB.svg", "partB": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000003/seed/partB.svg"}', null),

  -- Visit 3: the clinician skipped Part A partway (996, ADR-055); Sample B and Part B followed.
  ('40000000-0000-4000-8000-000000000005', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '30000000-0000-4000-8000-000000000003', 'trail-making', 1, 'completed', '0.0.0-seed',
   now() - interval '7 days' + interval '5 minutes', now() - interval '7 days' + interval '16 minutes',
   '{
     "sampleA": {"passed": true, "timeMs": 33900, "timeSeconds": 33.9, "correctLines": 7, "correctClicks": 8, "errors": 2},
     "partA": {"status": "stopped", "code": 996, "timeMs": 64200, "timeSeconds": 64.2, "correctLines": 9, "correctClicks": 10, "errors": 4},
     "sampleB": {"passed": true, "timeMs": 41200, "timeSeconds": 41.2, "correctLines": 7, "correctClicks": 8, "errors": 1},
     "partB": {"status": "completed", "code": null, "timeMs": 118400, "timeSeconds": 118.4, "correctLines": 24, "correctClicks": 25, "errors": 1}
   }',
   '{"seed": true}', 1440, 900, '{"sampleA": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000005/seed/sampleA.svg", "partA": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000005/seed/partA.svg", "sampleB": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000005/seed/sampleB.svg", "partB": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000005/seed/partB.svg"}', 'partA'),

  -- Visit 3: SWAPS to its time limit with two corrections, and one recall symbol left blank.
  ('40000000-0000-4000-8000-000000000006', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '30000000-0000-4000-8000-000000000003', 'swaps', 2, 'completed', '0.0.0-seed',
   now() - interval '7 days' + interval '18 minutes', now() - interval '7 days' + interval '23 minutes',
   '{
     "test": {"status": "timedOut", "timeMs": 60000, "attempted": 31, "correct": 31, "errors": 0, "corrections": 2},
     "recall": {"status": "completed", "correct": 5, "blank": 1},
     "practice": {"wrongAnswers": 1}
   }',
   '{"seed": true}', 1440, 900, '{"sheet": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000006/seed/sheet.svg"}', null);

-- Visit 2: SWAPS discontinued by a clinician partway through the timed part, so its partial score is kept and
-- recall was never given.
insert into public.sequence_tests (
  id, practice_id, sequence_id, test_id, position, status, test_version,
  started_at, completed_at, scores, raw_data, screen_width, screen_height,
  stop_requested_at, stop_reason, stopped_by, sheets
)
values (
  '40000000-0000-4000-8000-000000000004', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
  '30000000-0000-4000-8000-000000000002', 'swaps', 2, 'stopped', '0.0.0-seed',
  now() - interval '3 days' + interval '20 minutes', now() - interval '3 days' + interval '23 minutes',
  '{
    "test": {"status": "stopped", "timeMs": 28400, "attempted": 15, "correct": 14, "errors": 1, "corrections": 0},
    "recall": {"status": "notGiven"},
    "practice": {"wrongAnswers": 2}
  }',
  '{"seed": true}', 1440, 900,
  now() - interval '3 days' + interval '23 minutes', 'gave_up', '10000000-0000-4000-8000-000000000001',
  '{"sheet": "9fd7e9ef-8180-4ee6-b96a-b54143062035/40000000-0000-4000-8000-000000000004/seed/sheet.svg"}'
);

-- Visit 4: tests still to run. The database fills in status (pending) by itself.
insert into public.sequence_tests (id, practice_id, sequence_id, test_id, position)
values
  ('40000000-0000-4000-8000-000000000007', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '30000000-0000-4000-8000-000000000004', 'trail-making', 1),
  ('40000000-0000-4000-8000-000000000008', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
   '30000000-0000-4000-8000-000000000004', 'swaps', 2);

insert into public.sequence_test_notes (id, practice_id, sequence_test_id, body, created_by)
values (
  '50000000-0000-4000-8000-000000000001', '9fd7e9ef-8180-4ee6-b96a-b54143062035',
  '40000000-0000-4000-8000-000000000004',
  'Fake example note: the client asked to stop. Not about a real person.',
  '10000000-0000-4000-8000-000000000001'
);
