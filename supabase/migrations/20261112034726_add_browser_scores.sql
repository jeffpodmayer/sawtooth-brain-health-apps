-- When the browser's scores differ from the server's re-scoring, the browser's are kept
-- here as a flag for the clinician (roadmap 7.5). Empty when the two agree.
-- scores always holds the server's.
alter table public.sequence_tests
  add column browser_scores jsonb;

-- Only a test that ran can have them.
alter table public.sequence_tests
  add constraint sequence_tests_browser_scores_check
    check (browser_scores is null or status in ('completed', 'stopped'));
