// A small computer-screen icon next to a finished test's name. Hovering over it, or reaching it with Tab,
// shows the client's setup for that test: the browser and the screen size (redesigned at 8.9, ADR-047).
// The tip stays while the pointer is over the icon or the tip itself, and Esc hides it (WCAG 1.4.13).
// A click also shows it, for touch screens.

import { useId, useRef, useState } from "react";
import { useDismiss } from "./useDismiss";

type Props = { testName: string; browser: string | null; screen: string | null };

function SetupInfo({ testName, browser, screen }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipId = useId();
  useDismiss(open, setOpen, wrapperRef, buttonRef);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Setup for ${testName}`}
        aria-describedby={tipId}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      </button>
      {/* Always on the page, so a screen reader reads it with the button; shown only while open. */}
      <div
        id={tipId}
        role="tooltip"
        hidden={!open}
        className="absolute left-0 top-full z-10 w-72 rounded-xl border border-line bg-surface p-4 text-base shadow-lg"
      >
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
          <dt className="font-semibold">Browser</dt>
          <dd>{browser ?? "Not recorded"}</dd>
          <dt className="font-semibold">Screen</dt>
          <dd>{screen ?? "Not recorded"}</dd>
        </dl>
      </div>
    </div>
  );
}

export default SetupInfo;
