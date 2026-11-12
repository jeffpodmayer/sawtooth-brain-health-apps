-- Where a result's sheets are stored (roadmap 7.6, ADR-033).
-- Each sheet's name and its path in the sheets bucket, for example
-- {"partA": "<practice_id>/<sequence_test_id>/partA.svg"}.
-- {} when the test handed over no sheets. Empty (null) until the test ran.
alter table public.sequence_tests
  add column sheets jsonb;

-- Filled exactly when the test ran, and always as a list of names and paths.
alter table public.sequence_tests
  add constraint sequence_tests_sheets_check check (
    (status in ('completed', 'stopped') and jsonb_typeof(sheets) = 'object')
    or
    (status in ('pending', 'not_given') and sheets is null)
  );
