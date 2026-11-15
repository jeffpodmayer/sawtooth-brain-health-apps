// The arrow on a section that opens and closes: points right when closed, down when open.
// Used by each visit and each test on the client page. A test's arrow is smaller and grey ("small"),
// so the visit's arrow reads as the main one.

function Chevron({ open, small = false }: { open: boolean; small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 fill-none stroke-2 ${small ? "size-4 stroke-ink-muted" : "size-5 stroke-ink"} ${open ? "rotate-90" : ""}`}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export default Chevron;
