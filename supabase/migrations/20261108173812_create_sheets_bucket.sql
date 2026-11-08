-- Sheets bucket: the saved SVG for each test (ADR-008), under <practice_id>/ (ADR-003).
-- Private. Edge Functions save the files (7.6); clinicians only read their own practice's.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sheets', 'sheets', false, 5242880, array['image/svg+xml']);

create policy sheets_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'sheets'
    and (storage.foldername(name))[1] = (select private.current_practice_id())::text
  );
