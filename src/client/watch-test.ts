// Keeps the client's tab up to date on the test it's on (roadmap 9.3–9.4, ADR-051). It asks check-status
// at the start, on each "check now" ping, and every few seconds anyway, in case real-time is blocked.
// One check at a time: a ping or poll during a check asks once more when it ends.

import type { StatusCheck } from "./check-status";

// With real-time blocked, a stop or Continue arrives within this time.
export const POLL_INTERVAL_MS = 3_000;

export type WatchOptions = {
  check: () => Promise<StatusCheck>;
  listen: (onCheck: () => void) => () => void;
  onStatus: (result: StatusCheck) => void;
  intervalMs?: number;
};

// Returns a function that stops watching: no more checks, and an answer still on its way is dropped.
export function watchTest({ check, listen, onStatus, intervalMs = POLL_INTERVAL_MS }: WatchOptions): () => void {
  let stopped = false;
  let checking = false;
  let again = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function run() {
    if (stopped) return;
    if (checking) {
      again = true;
      return;
    }
    checking = true;
    clearTimeout(timer);
    const result = await check().catch((): StatusCheck => ({ status: "failed" }));
    checking = false;
    if (stopped) return;

    onStatus(result);

    // An unknown link, or a test that already has a result: nothing more to ask.
    if (result.status === "notValid") {
      stop();
    } else if (again) {
      again = false;
      void run();
    } else {
      timer = setTimeout(run, intervalMs);
    }
  }

  const stopListening = listen(() => void run());
  void run();

  function stop() {
    stopped = true;
    clearTimeout(timer);
    stopListening();
  }

  return stop;
}
