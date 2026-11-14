-- Live updates on the client page (roadmap 9.2). Supabase sends a row's changes to a signed-in clinician only
-- if RLS lets them read that row, so another practice's changes never arrive, and clients (who never sign in)
-- get nothing. The page only uses a change as a signal to re-read; it never shows the sent row itself.
alter publication supabase_realtime add table public.sequences, public.sequence_tests;
