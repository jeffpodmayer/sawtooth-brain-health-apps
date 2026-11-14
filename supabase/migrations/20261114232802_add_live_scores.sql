-- Live section scores (ADR-058). As each section of a running test finishes, the client's tab sends that
-- section's scores (through report-progress, checked by link token), so the dashboard can fill its row straight
-- away. Display only, like the live counter (ADR-048): never part of the result. The saved result's scores,
-- re-checked on the server (ADR-040), replace them; save-result clears this when it saves.

-- 1. The finished sections' scores, in the test's own shape, or empty. Written only by Edge Functions.
--    The size limit keeps a misbehaving browser from storing anything large: real values are a few hundred bytes.
alter table public.sequence_tests
  add column live_scores jsonb,
  add constraint sequence_tests_live_scores_size_check
    check (live_scores is null or octet_length(live_scores::text) <= 20000);
