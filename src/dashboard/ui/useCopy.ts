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

  // Says whether it worked, so a caller can move on only after a real copy.
  async function copy(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      return true;
    } catch {
      setStatus("failed");
      return false;
    }
  }

  return { status, copy };
}
