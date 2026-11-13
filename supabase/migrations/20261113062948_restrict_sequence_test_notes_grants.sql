-- Narrow what clinicians can write to notes (ADR-027). Adding a note sets only these four
-- columns, and editing changes only the text. The database fills in the id and the times.
-- Reading and deleting are unchanged (RLS still limits both to the clinician's own practice,
-- and deleting to the note's author).
revoke insert, update on public.sequence_test_notes from authenticated;

grant insert (practice_id, sequence_test_id, body, created_by)
  on public.sequence_test_notes to authenticated;

grant update (body) on public.sequence_test_notes to authenticated;
