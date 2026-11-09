-- Fake data for development only. Never run this on production (ADR-004).
-- Loaded automatically after a database reset, once the migrations have run.

-- Same ids as the first hand-made rows, so files in the sheets bucket stay in the right folders.
insert into public.practices (id, name)
values
  ('9fd7e9ef-8180-4ee6-b96a-b54143062035', 'Sawtooth Brain Health Institute'),
  ('4d5c949a-12ca-4902-b1fb-d73d7637f7e7', 'Fake Practice (dev only)');

-- A reset deletes all logins, so the seed makes them again.
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

-- TEST-001 is in both practices on purpose: codes are unique per practice, not across the app.
insert into public.clients (id, practice_id, code)
values
  ('20000000-0000-4000-8000-000000000001', '9fd7e9ef-8180-4ee6-b96a-b54143062035', 'TEST-001'),
  ('20000000-0000-4000-8000-000000000002', '9fd7e9ef-8180-4ee6-b96a-b54143062035', 'TEST-002'),
  ('20000000-0000-4000-8000-000000000003', '4d5c949a-12ca-4902-b1fb-d73d7637f7e7', 'TEST-001');

-- One open visit for Sawtooth's TEST-001, created by Test Clinician One.
-- The database fills in link_token and status (open) by itself.
insert into public.sequences (id, practice_id, client_id, created_by)
values (
  '30000000-0000-4000-8000-000000000001',
  '9fd7e9ef-8180-4ee6-b96a-b54143062035',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001'
);

-- A finished Trail Making result. Scores follow its SPEC; the numbers are made up.
insert into public.sequence_tests (
  id, practice_id, sequence_id, test_id, position, status, test_version,
  started_at, completed_at, scores, raw_data, screen_width, screen_height
)
values (
  '40000000-0000-4000-8000-000000000001',
  '9fd7e9ef-8180-4ee6-b96a-b54143062035',
  '30000000-0000-4000-8000-000000000001',
  'trail-making', 1, 'completed', '0.0.0-seed',
  now() - interval '30 minutes', now() - interval '20 minutes',
  '{
    "partA": {"status": "completed", "code": null, "timeMs": 38000, "timeSeconds": 38, "correctLines": 24, "correctClicks": 25, "errors": 0},
    "partB": {"status": "completed", "code": null, "timeMs": 91000, "timeSeconds": 91, "correctLines": 24, "correctClicks": 25, "errors": 1},
    "sampleA": {"passed": true},
    "sampleB": {"passed": true}
  }',
  '{"seed": true}',
  1440, 900
);

-- A SWAPS result stopped partway by a clinician, so its partial score is kept.
insert into public.sequence_tests (
  id, practice_id, sequence_id, test_id, position, status, test_version,
  started_at, completed_at, scores, raw_data, screen_width, screen_height,
  stop_reason, stopped_by
)
values (
  '40000000-0000-4000-8000-000000000002',
  '9fd7e9ef-8180-4ee6-b96a-b54143062035',
  '30000000-0000-4000-8000-000000000001',
  'swaps', 2, 'stopped', '0.0.0-seed',
  now() - interval '15 minutes', now() - interval '10 minutes',
  '{
    "test": {"status": "stopped", "timeMs": 31000, "attempted": 24, "correct": 23, "errors": 1, "corrections": 1},
    "recall": {"status": "notGiven"},
    "practice": {"wrongAnswers": 0}
  }',
  '{"seed": true}',
  1440, 900,
  'gave_up', '10000000-0000-4000-8000-000000000001'
);

insert into public.sequence_test_notes (id, practice_id, sequence_test_id, body, created_by)
values (
  '50000000-0000-4000-8000-000000000001',
  '9fd7e9ef-8180-4ee6-b96a-b54143062035',
  '40000000-0000-4000-8000-000000000001',
  'Fake development note. Not about a real person.',
  '10000000-0000-4000-8000-000000000001'
);
