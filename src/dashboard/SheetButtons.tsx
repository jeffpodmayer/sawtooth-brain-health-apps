// A score row's sheet buttons on the client page (ADR-047): view the sheet in a window, or download it.
// A sheet is SVG sent by the browser and could contain script, so it shows only through <img>, which never
// runs it (ADR-041). The files are private: each click gets a fresh signed URL that works for 10 minutes,
// marked as a download, so opening one directly downloads it instead of showing it as a page.

import { useEffect, useId, useRef, useState } from "react";
import { supabase } from "./supabase";

const SIGNED_URL_SECONDS = 10 * 60;
const iconButtonClass =
  "flex size-10 items-center justify-center rounded-lg text-accent hover:bg-hover focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-70";
// A small tip above each icon, shown on hover or keyboard focus, in the same white card style as the setup
// info. Its right edge lines up with the button's, so it isn't cut off at the right side of the visits card.
// Screen readers skip it: the button's own label already says the same, with the sheet's name.
const tipClass =
  "pointer-events-none invisible absolute bottom-full right-0 z-10 mb-1 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-1.5 text-base text-ink shadow-md group-focus-within:visible group-hover:visible";
const closeButtonClass =
  "-mr-3 -mt-2 flex size-12 shrink-0 items-center justify-center rounded-lg hover:bg-hover focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent";

// title names the sheet, e.g. "TEST-001 · Trail Making · Part A". fileName is what a download is saved as.
function SheetButtons({ path, title, fileName }: { path: string; title: string; fileName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Shown once the image's address is ready.
  useEffect(() => {
    if (viewUrl) dialogRef.current?.showModal();
  }, [viewUrl]);

  async function signedUrl(download: string | true): Promise<string | null> {
    setBusy(true);
    setFailed(false);
    const { data, error } = await supabase.storage
      .from("sheets")
      .createSignedUrl(path, SIGNED_URL_SECONDS, { download });
    setBusy(false);
    if (error) {
      setFailed(true);
      return null;
    }
    return data.signedUrl;
  }

  async function view() {
    const url = await signedUrl(true);
    if (url) setViewUrl(url);
  }

  // The file is marked as a download, so the browser saves it and stays on this page.
  async function download() {
    const url = await signedUrl(fileName);
    if (url) window.location.assign(url);
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex gap-2">
        <div className="group relative">
          <button type="button" onClick={view} disabled={busy} aria-label={`View ${title}`} className={iconButtonClass}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <span aria-hidden="true" className={tipClass}>
            View test sheet
          </span>
        </div>
        <div className="group relative">
          <button
            type="button"
            onClick={download}
            disabled={busy}
            aria-label={`Download ${title}`}
            className={iconButtonClass}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
              <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
            </svg>
          </button>
          <span aria-hidden="true" className={tipClass}>
            Download test sheet
          </span>
        </div>
      </div>
      {failed && (
        <p role="alert" className="mt-1 text-base">
          Couldn't load the sheet. Try again.
        </p>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setViewUrl(null)}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-4xl rounded-xl bg-surface p-6 text-ink backdrop:bg-ink/60"
      >
        {viewUrl && (
          <>
            <div className="flex items-center justify-between gap-4">
              <h2 id={titleId} className="text-xl font-semibold">
                {title}
              </h2>
              {/* The same ✕ as the note dialogs. */}
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className={closeButtonClass}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <img
              src={viewUrl}
              alt={title}
              className="mx-auto mt-4 max-h-[calc(100vh-10rem)] w-auto border border-line bg-white"
            />
          </>
        )}
      </dialog>
    </div>
  );
}

export default SheetButtons;
