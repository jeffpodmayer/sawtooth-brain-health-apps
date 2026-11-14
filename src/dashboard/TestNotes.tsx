// Clinicians' notes on one finished test (roadmap 8.8, redesigned at 8.9), shown like a text conversation:
// oldest first, so the newest sits just above Add note.
// Adding, editing and deleting happen in NoteDialog. Everyone in the practice can read notes; only the author
// can edit or delete one (RLS, ADR-025). Clients never see them: client screens reach only the Edge Functions,
// which never read notes.

import { useEffect, useState, type SubmitEvent } from "react";
import { formatDateTime } from "./formatDate";
import NoteDialog, { type Note, type NoteDialogState } from "./NoteDialog";
import { supabase } from "./supabase";
import { useMe } from "./useMe";
import { useSession } from "./useSession";

type Load = { state: "loading" } | { state: "failed" } | { state: "loaded"; notes: Note[] };

const noteColumns = "id, body, created_by, created_at, updated_at, clinicians(display_name)";
const checkConnection = "Check your internet connection and try again.";

// A 48px click area around a small icon.
const iconButtonClass =
  "flex size-10 items-center justify-center rounded-lg hover:bg-hover focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent";

// Which side each note sits on, like a text conversation: the first note is on the left, and the side
// switches each time a different clinician wrote the next note. A clinician's notes in a row stay together.
function noteSides(notes: Note[]): ("left" | "right")[] {
  const sides: ("left" | "right")[] = [];
  notes.forEach((note, index) => {
    if (index === 0) sides.push("left");
    else {
      const previous = sides[index - 1];
      const sameAuthor = note.created_by === notes[index - 1].created_by;
      sides.push(sameAuthor ? previous : previous === "left" ? "right" : "left");
    }
  });
  return sides;
}

// One note, as a message bubble: grey on the left, teal on the right. The author's name is above the first
// of their notes in a row. Only the author gets the pencil, which opens Edit (where Delete note is).
type NoteCardProps = { note: Note; side: "left" | "right"; showName: boolean; mine: boolean; onEdit: () => void };

function NoteCard({ note, side, showName, mine, onEdit }: NoteCardProps) {
  const written = formatDateTime(note.created_at);
  const when = `${written}${note.updated_at ? ` · Edited ${formatDateTime(note.updated_at)}` : ""}`;
  const right = side === "right";
  return (
    <li className={`flex flex-col ${right ? "items-end" : "items-start"}`}>
      {showName && <p className="mb-1 px-1 text-base font-semibold">{note.clinicians?.display_name ?? "—"}</p>}
      <p
        className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 ${
          right ? "rounded-br-md bg-success-bg" : "rounded-bl-md border border-line bg-page"
        }`}
      >
        {note.body}
      </p>
      <div className="flex items-center gap-1">
        <p className="px-1 text-base text-ink-muted">{when}</p>
        {mine && (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={onEdit}
            aria-label={`Edit note written ${written}`}
            className={`${iconButtonClass} text-accent`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
              <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}

type Props = {
  sequenceTestId: string;
  practiceId: string;
  subtitle: string; // the dialog's subtitle, e.g. "Trail Making · TEST-001 · Nov 11, 2026"
  dialog: NoteDialogState; // held by TestBlock, whose "+ Note" button opens Add
  setDialog: (dialog: NoteDialogState) => void;
};

function TestNotes({ sequenceTestId, practiceId, subtitle, dialog, setDialog }: Props) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const session = useSession();
  const me = useMe();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("sequence_test_notes")
      .select(noteColumns)
      .eq("sequence_test_id", sequenceTestId)
      .order("created_at")
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoad(error ? { state: "failed" } : { state: "loaded", notes: data });
      });
    return () => {
      cancelled = true;
    };
  }, [sequenceTestId]);

  function updateNotes(change: (notes: Note[]) => Note[]) {
    setLoad((current) => (current.state === "loaded" ? { state: "loaded", notes: change(current.notes) } : current));
  }

  // Adds or edits. The database checks the practice and author again (RLS), so these values can't be faked.
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || dialog === null || dialog.mode === "delete") return;
    const body = dialog.draft.trim();
    if (body === "") {
      setError("Type a note before saving.");
      return;
    }
    if (dialog.mode === "edit" && body === dialog.note.body) {
      setDialog(null); // nothing changed, so nothing to save
      return;
    }
    const userId = session?.user.id;
    if (dialog.mode === "add" && !userId) {
      setError(`Couldn't save the note. ${checkConnection}`);
      return;
    }
    setBusy(true);
    setError(null);
    // Editing someone else's note matches no row, so .single() fails.
    const { data, error } =
      dialog.mode === "add"
        ? await supabase
            .from("sequence_test_notes")
            .insert({ practice_id: practiceId, sequence_test_id: sequenceTestId, body, created_by: userId! })
            .select(noteColumns)
            .single()
        : await supabase
            .from("sequence_test_notes")
            .update({ body })
            .eq("id", dialog.note.id)
            .select(noteColumns)
            .single();
    setBusy(false);
    if (error) {
      setError(`Couldn't save the ${dialog.mode === "add" ? "note" : "change"}. ${checkConnection}`);
      return;
    }
    if (dialog.mode === "add") updateNotes((notes) => [...notes, data]); // the newest goes at the bottom
    else updateNotes((notes) => notes.map((note) => (note.id === data.id ? data : note)));
    setDialog(null);
  }

  async function confirmDelete() {
    if (busy || dialog?.mode !== "delete") return;
    const id = dialog.note.id;
    setBusy(true);
    setError(null);
    // .select("id") returns the deleted row, so a delete that matched nothing counts as a failure.
    const { data, error } = await supabase.from("sequence_test_notes").delete().eq("id", id).select("id");
    setBusy(false);
    if (error || data.length === 0) {
      setError(`Couldn't delete the note. ${checkConnection}`);
      return;
    }
    updateNotes((notes) => notes.filter((note) => note.id !== id));
    setDialog(null);
  }

  const sides = load.state === "loaded" ? noteSides(load.notes) : [];

  return (
    <div className="mt-2">
      {load.state === "loading" && <p className="text-base text-ink-muted">Loading notes…</p>}
      {load.state === "failed" && (
        <p role="alert" className="text-base">
          Couldn't load the notes. Reload the page to try again.
        </p>
      )}
      {load.state === "loaded" && load.notes.length > 0 && (
        <ul aria-label="Notes" className="mt-4 flex flex-col gap-3">
          {load.notes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              side={sides[index]}
              showName={index === 0 || note.created_by !== load.notes[index - 1].created_by}
              mine={note.created_by === session?.user.id}
              onEdit={() => setDialog({ mode: "edit", note, draft: note.body })}
            />
          ))}
        </ul>
      )}

      <NoteDialog
        state={load.state === "loaded" ? dialog : null}
        subtitle={subtitle}
        savingAs={me?.displayName ?? null}
        busy={busy}
        error={error}
        onDraftChange={(draft) => {
          if (dialog?.mode === "add") setDialog({ mode: "add", draft });
          else if (dialog?.mode === "edit") setDialog({ ...dialog, draft });
        }}
        onSave={save}
        onAskDelete={() => {
          if (dialog?.mode === "edit") setDialog({ mode: "delete", note: dialog.note, editDraft: dialog.draft });
        }}
        onKeep={() => {
          if (dialog?.mode !== "delete") return;
          setError(null);
          setDialog({ mode: "edit", note: dialog.note, draft: dialog.editDraft });
        }}
        onConfirmDelete={confirmDelete}
        onClosed={() => {
          setError(null);
          setDialog(null);
        }}
      />
    </div>
  );
}

export default TestNotes;
