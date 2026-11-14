// The icon on every Copy link button: a link, which turns into a check once the link is copied.
// Screen readers skip it; the button's words ("Copy link", "Copied") carry the meaning.

function CopyIcon({ copied }: { copied: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-current stroke-2">
      {copied ? (
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      ) : (
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      )}
    </svg>
  );
}

export default CopyIcon;
