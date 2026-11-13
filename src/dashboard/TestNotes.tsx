// Clinicians' notes on one finished test (roadmap 8.8, ADR-025), newest first. Everyone in the practice
// can read them. Clients never see them: client screens reach only the Edge Functions, which never read notes.

import { useEffect, useState, type SubmitEvent } from "react";
import { formatDateTime } from "./formatDate";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

type Note = {
  id: string;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string | null; // empty until the text is first changed
  clinicians: { display_name: string } | null; // the author
};

type Load = { state: "loading" } | { state: "failed" } | { state: "loaded"; notes: Note[] };

const noteColumns = "id, body, created_by, created_at, updated_at, clinicians(display_name)";
const couldntSave = "Couldn't save the note. Check your internet connection and try again.";

const fieldClass =
  "mt-2 block w-full max-w-2xl rounded-lg border-2 border-ink-muted bg-white p-4 text-ink focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";
const saveButtonClass =
  "h-12 rounded-lg bg-accent px-6 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-70";
// The same look as Sign out.
const secondaryButtonClass =
  "h-12 rounded-lg border-2 border-accent px-6 font-bold text-accent focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

// One note. Its author can edit or delete it; the database refuses anyone else (RLS, ADR-025).
function NoteCard({
  note,
  mine,
  onChanged,
  onDeleted,
}: {
  note: Note;
  mine: boolean;
  onChanged: (note: Note) => void;
  onDeleted: (id: string) => void;
}) {
  const [mode, setMode] = useState<"view" | "editing" | "confirmingDelete">("view");
  const [draft, setDraft] = useState(note.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const written = formatDateTime(note.created_at);
  const fieldId = `edit-note-${note.id}`;

  function startEditing() {
    setDraft(note.body);
    setError(null);
    setMode("editing");
  }

  function backToView() {
    setError(null);
    setMode("view");
  }

  async function saveEdit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const body = draft.trim();
    if (body === "") {
      setError("Type a note before saving.");
      return;
    }
    if (body === note.body) {
      backToView(); // nothing changed, so nothing to save
      return;
    }
    setBusy(true);
    setError(null);
    // A note that isn't the clinician's own matches no row, so .single() fails.
    const { data, error } = await supabase
      .from("sequence_test_notes")
      .update({ body })
      .eq("id", note.id)
      .select(noteColumns)
      .single();
    setBusy(false);
    if (error) {
      setError("Couldn't save the change. Check your internet connection and try again.");
      return;
    }
    onChanged(data);
    setMode("view");
  }

  async function confirmDelete() {
    if (busy) return;
    setBusy(true);
    setError(null);
    // .select("id") returns the deleted row, so a delete that matched nothing counts as a failure.
    const { data, error } = await supabase.from("sequence_test_notes").delete().eq("id", note.id).select("id");
    setBusy(false);
    if (error || data.length === 0) {
      setError("Couldn't delete the note. Check your internet connection and try again.");
      return;
    }
    onDeleted(note.id);
  }

  return (
    <li className="rounded-lg border border-form-gray p-4">
      {mode === "editing" ? (
        <form onSubmit={saveEdit}>
          <label htmlFor={fieldId} className="font-bold">
            Edit note
          </label>
          <textarea
            id={fieldId}
            autoFocus
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={fieldClass}
          />
          {error && (
            <p role="alert" className="mt-2">
              {error}
            </p>
          )}
          <div className="mt-3 flex gap-4">
            <button type="submit" disabled={busy} className={saveButtonClass}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={backToView} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="whitespace-pre-wrap break-words">{note.body}</p>
      )}
      <p className="mt-2 text-ink-muted">
        {note.clinicians?.display_name ?? "—"} · {written}
        {note.updated_at && ` · Edited ${formatDateTime(note.updated_at)}`}
      </p>

      {mine && mode === "view" && (
        <div className="mt-3 flex gap-4">
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit note written ${written}`}
            className={secondaryButtonClass}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode("confirmingDelete")}
            aria-label={`Delete note written ${written}`}
            className={secondaryButtonClass}
          >
            Delete
          </button>
        </div>
      )}

      {mode === "confirmingDelete" && (
        <div className="mt-3">
          <p className="font-bold">Delete this note? It can't be recovered.</p>
          {error && (
            <p role="alert" className="mt-2">
              {error}
            </p>
          )}
          <div className="mt-2 flex gap-4">
            <button type="button" onClick={confirmDelete} disabled={busy} className={saveButtonClass}>
              {busy ? "Deleting…" : "Delete note"}
            </button>
            <button type="button" onClick={backToView} autoFocus className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function TestNotes({ sequenceTestId, practiceId }: { sequenceTestId: string; practiceId: string }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const session = useSession();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("sequence_test_notes")
      .select(noteColumns)
      .eq("sequence_test_id", sequenceTestId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoad(error ? { state: "failed" } : { state: "loaded", notes: data });
      });
    return () => {
      cancelled = true;
    };
  }, [sequenceTestId]);

  // The database checks the practice and author again (RLS), so these values can't be faked.
  async function addNote(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const body = draft.trim();
    if (body === "") {
      setSaveError("Type a note before saving.");
      return;
    }
    const userId = session?.user.id;
    if (!userId) {
      setSaveError(couldntSave);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const { data, error } = await supabase
      .from("sequence_test_notes")
      .insert({ practice_id: practiceId, sequence_test_id: sequenceTestId, body, created_by: userId })
      .select(noteColumns)
      .single();
    setSaving(false);
    if (error) {
      setSaveError(couldntSave);
      return;
    }
    setDraft("");
    setLoad((current) => (current.state === "loaded" ? { state: "loaded", notes: [data, ...current.notes] } : current));
  }

  const fieldId = `note-${sequenceTestId}`;
  const hintId = `note-hint-${sequenceTestId}`;

  return (
    <>
      <h3 className="mt-6 text-xl font-bold">Notes</h3>
      {load.state === "loading" && <p className="mt-2">Loading notes…</p>}
      {load.state === "failed" && (
        <p role="alert" className="mt-2">
          Couldn't load the notes. Close Details and open it again to try again.
        </p>
      )}
      {load.state === "loaded" && (
        <>
          <form onSubmit={addNote} className="mt-2">
            <label htmlFor={fieldId} className="font-bold">
              Add a note
            </label>
            <p id={hintId} className="text-ink-muted">
              Use the client code only. No names or other identifying details.
            </p>
            <textarea
              id={fieldId}
              aria-describedby={hintId}
              rows={4}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className={fieldClass}
            />
            {saveError && (
              <p role="alert" className="mt-2">
                {saveError}
              </p>
            )}
            <button type="submit" disabled={saving} className={`mt-3 ${saveButtonClass}`}>
              {saving ? "Saving…" : "Save note"}
            </button>
          </form>

          {load.notes.length === 0 && <p className="mt-4">No notes yet.</p>}
          {load.notes.length > 0 && (
            <ul className="mt-4 space-y-4">
              {load.notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  mine={note.created_by === session?.user.id}
                  onChanged={(changed) =>
                    setLoad((current) =>
                      current.state === "loaded"
                        ? { state: "loaded", notes: current.notes.map((n) => (n.id === changed.id ? changed : n)) }
                        : current,
                    )
                  }
                  onDeleted={(id) =>
                    setLoad((current) =>
                      current.state === "loaded"
                        ? { state: "loaded", notes: current.notes.filter((n) => n.id !== id) }
                        : current,
                    )
                  }
                />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

export default TestNotes;
