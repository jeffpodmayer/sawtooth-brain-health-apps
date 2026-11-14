// The running test's live signs on the client page (roadmap 9.1, ADR-048): a glowing dot once the client's tab
// has begun the test, and a counter while a timed part runs. Both are for display only.

import { useEffect, useState } from "react";

// A dot with a glow: a copy of it behind grows and fades every 2 seconds. Red while the test runs, yellow while
// it waits for Continue. The glow is hidden when the computer asks for reduced motion, leaving a steady dot.
// Screen readers skip it; the words next to it ("In progress", "Waiting for you") carry the meaning.
export function LiveDot({ waiting }: { waiting: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative mr-2 inline-block size-2.5 align-middle ${waiting ? "text-hold-dot" : "text-danger"}`}
    >
      <span className="absolute inset-0 rounded-full bg-current animate-live-glow motion-reduce:hidden" />
      <span className="relative block size-2.5 rounded-full bg-current" />
    </span>
  );
}

// m:ss since the timed part started, ticking each second; frozen at the stop request once one is sent.
// The start comes from the server's clock and "now" from the clinician's, so it can be off by the difference
// between them. That's fine for a display; nothing measured or scored uses it (ADR-048).
export function TimedCounter({ startedAt, stoppedAt }: { startedAt: string; stoppedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (stoppedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [stoppedAt]);

  const end = stoppedAt ? Date.parse(stoppedAt) : now;
  const seconds = Math.max(0, Math.floor((end - Date.parse(startedAt)) / 1000));
  const shown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  // No live region: a screen reader would otherwise read it out every second.
  return (
    <span className="tabular-nums">
      <span className="sr-only">timed part running for </span>
      {shown}
    </span>
  );
}
