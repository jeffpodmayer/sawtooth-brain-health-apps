// Copies text for a Copy link button. "copied" lasts a second, then the button goes back to Copy link.
// "failed" stays, so the clinician has time to read what to do instead.

import { useEffect, useState } from "react";

const copiedFor = 1000; // ms

export function useCopy(text: string) {
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);

  useEffect(() => {
    if (status !== "copied") return;
    const timer = setTimeout(() => setStatus(null), copiedFor);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return { status, copy };
}
