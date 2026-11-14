-- Which timed part is running, so the dashboard shows the counter in that part's row (roadmap 9.1, ADR-048).
-- The key (e.g. 'partA') means something only to its test; the database just keeps it with its start time.
alter table public.sequence_tests
  add column timed_part text,
  add constraint sequence_tests_timed_part_key_check
    check ((timed_part is null) = (timed_part_started_at is null));
