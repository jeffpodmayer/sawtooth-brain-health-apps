// The dashboard's shared control styles (ADR-047), so every screen's buttons and fields match.
// Based on the Client page's buttons. These set the look; each screen adds its own spacing and width.

// The keyboard focus ring: a 3px teal outline just outside the control, as thick as a focused field's
// border and ring together, so focus looks the same on every control.
const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent";

// The same ring drawn just inside, for rows, menus and controls inside a field, where an outside ring
// would be cut off or cover something.
const focusRingInset = "focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-accent";

const looks = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-accent bg-surface text-accent hover:bg-hover",
  danger: "bg-danger text-white hover:bg-danger-strong",
  dangerOutline: "border border-danger bg-surface text-danger hover:bg-danger-tint",
};

const sizes = {
  standard: "h-12 px-6",
  small: "h-9 px-4 text-base", // the running test's row (Continue, End current test)
  icon: "size-12", // a square button with only an icon, such as the ⋯ menu
};

// A button: its look, and standard (48px) or small (36px).
export function buttonClass(look: keyof typeof looks, size: keyof typeof sizes = "standard"): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-medium disabled:opacity-70 ${focusRing} ${looks[look]} ${sizes[size]}`;
}

// A button that's only teal text, such as Show beside the password.
export const textButtonClass = `rounded-lg font-medium text-accent hover:bg-hover ${focusRingInset}`;

// A borderless button with only an icon, such as a window's ✕. Each screen sets its size.
export const iconButtonClass = `flex shrink-0 items-center justify-center rounded-lg hover:bg-hover ${focusRingInset}`;

// A window (the browser's modal <dialog>). No outer padding, so the header's colour reaches the edges.
// Each window adds its own width.
export const dialogClass =
  "m-auto w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-surface p-0 text-ink backdrop:bg-ink/60";

// The pale teal band across the top of a window, holding its title, subtitle and ✕.
export const dialogHeaderClass = "flex items-center justify-between gap-4 bg-success-bg px-8 py-4";

// Everything under a window's header.
export const dialogBodyClass = "px-8 pb-8";

// A window's ✕: a round hover in a slightly deeper teal than the band, so it reads as part of the header.
export const dialogCloseClass = `-mr-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-accent/10 ${focusRingInset}`;

// Every text input. On focus, a teal border and a thin teal ring that hugs it.
const fieldBase =
  "block w-full rounded-lg border border-field-line bg-white text-ink placeholder:text-ink-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent";

// A one-line input.
export const fieldClass = `${fieldBase} h-12 px-4`;

// A box for several lines, such as a note.
export const textAreaClass = `${fieldBase} p-4`;
