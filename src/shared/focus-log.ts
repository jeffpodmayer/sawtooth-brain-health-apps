// Records when the test's tab was hidden or lost focus (rawData's focus log).

import type { Clock } from "./clock";

export type FocusLogEntry = {
  timeMs: number;
  event: "hidden" | "visible" | "blur" | "focus";
};

// Starts recording into `log`. Returns the function that stops it.
export function recordFocus(clock: Clock, log: FocusLogEntry[]): () => void {
  function add(event: FocusLogEntry["event"]) {
    log.push({ timeMs: clock.now(), event });
  }

  const onVisibility = () => add(document.visibilityState === "hidden" ? "hidden" : "visible");
  const onBlur = () => add("blur");
  const onFocus = () => add("focus");

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
  };
}
