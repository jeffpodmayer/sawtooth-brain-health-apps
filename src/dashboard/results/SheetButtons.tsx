// A score row's sheet buttons on the client page (ADR-047): view the sheet in a window, or download it as a PDF
// (roadmap 10.2). A sheet is SVG sent by the browser and could contain script, so it's only ever drawn through
// <img>, which never runs it (ADR-041). The files are private: View gets a fresh signed URL that works for
// 10 minutes, marked as a download, so opening one directly downloads it instead of showing it as a page.
// Download reads the file through the storage rules and makes the PDF in the browser.

import { useEffect, useId, useRef, useState } from "react";
import { saveFile } from "./save-file";
import { sheetPdf } from "./sheet-pdf";
import { SheetSkeleton } from "../ui/Skeleton";
import { dialogBodyClass, dialogClass, dialogCloseClass, dialogHeaderClass, iconButtonClass } from "../styles";
import { supabase } from "../supabase";

const SIGNED_URL_SECONDS = 10 * 60;
const sheetIconClass = `size-10 text-accent disabled:opacity-70 ${iconButtonClass}`;
// A small tip above each icon, shown on hover or on keyboard focus (not after a click, so it doesn't stay up when
// the window closes and the button gets focus back), in the same white card style as the setup info. Hidden while
// the sheet's window is open. Its right edge lines up with the button's, so it isn't cut off at the right side of
// the visits card. Screen readers skip it: the button's own label already says the same, with the sheet's name.
const tipClass =
  "pointer-events-none invisible absolute bottom-full right-0 z-10 mb-1 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-1.5 text-base text-ink shadow-md group-hover:visible group-has-[:focus-visible]:visible";

// title names the sheet, e.g. "TEST-001 · Trail Making · Part A". heading tops the PDF, e.g. the title and the
// test's date, with scoreLines under it. fileName is what the PDF is saved as.
type Props = { path: string; title: string; heading: string; scoreLines: string[]; fileName: string };

function SheetButtons({ path, title, heading, scoreLines, fileName }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // The window opens at once, at its final size, with a placeholder page until the sheet has loaded.
  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  async function view() {
    setFailed(false);
    setViewUrl(null);
    setImageLoaded(false);
    setOpen(true);
    const { data, error } = await supabase.storage
      .from("sheets")
      .createSignedUrl(path, SIGNED_URL_SECONDS, { download: true });
    if (error) {
      dialogRef.current?.close();
      setFailed(true);
    } else {
      setViewUrl(data.signedUrl);
    }
  }

  // Each opening starts fresh.
  function handleClose() {
    setOpen(false);
    setViewUrl(null);
    setImageLoaded(false);
  }

  // The sheet as a one-page PDF with a heading, made in this browser and saved as a download.
  async function download() {
    setBusy(true);
    setFailed(false);
    try {
      const { data, error } = await supabase.storage.from("sheets").download(path);
      if (error) throw error;
      saveFile(await sheetPdf(await data.text(), heading, scoreLines), fileName);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex gap-2">
        <div className="group relative">
          <button type="button" onClick={view} disabled={busy} aria-label={`View ${title}`} className={sheetIconClass}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <span aria-hidden="true" className={`${tipClass} ${open ? "hidden" : ""}`}>
            View test sheet
          </span>
        </div>
        <div className="group relative">
          <button
            type="button"
            onClick={download}
            disabled={busy}
            aria-label={`Download ${title}`}
            className={sheetIconClass}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
              <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
            </svg>
          </button>
          <span aria-hidden="true" className={`${tipClass} ${open ? "hidden" : ""}`}>
            Download test sheet
          </span>
        </div>
      </div>
      {failed && (
        <p role="alert" className="mt-1 text-base">
          Couldn't load the sheet. Try again.
        </p>
      )}

      <dialog ref={dialogRef} onClose={handleClose} aria-labelledby={titleId} className={`max-w-4xl ${dialogClass}`}>
        {open && (
          <>
            <div className={dialogHeaderClass}>
              <h2 id={titleId} className="text-3xl font-semibold">
                {title}
              </h2>
              {/* The same ✕ as every window. */}
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className={dialogCloseClass}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className={dialogBodyClass}>
              {/* A fixed-height frame, so the window never changes size: the placeholder sheens on the page until
                  the sheet has loaded, then the sheet fills the page. */}
              <div className="mt-6 flex h-[min(calc(100vh-12rem),44rem)] justify-center">
                {/* The page: letter size, portrait, like a sheet of paper (white, a thin edge, a soft shadow).
                    Every sheet is drawn on an 850 × 1100 page, the same shape, so it fills the page exactly. */}
                <div className="relative aspect-[8.5/11] h-full max-w-full border border-line bg-white shadow-md">
                  {!imageLoaded && <SheetSkeleton />}
                  {viewUrl && (
                    <img
                      src={viewUrl}
                      alt={title}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        dialogRef.current?.close();
                        setFailed(true);
                      }}
                      className={`h-full w-full object-contain ${imageLoaded ? "" : "invisible"}`}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}

export default SheetButtons;
