// Shown before each test while it waits at its first hold (roadmap 7.4, 9.5). The client and clinician
// can talk; the clinician's Continue on the dashboard starts the test (ADR-050). No button: after the
// first click, the client never needs to act except to take the test, and only a clinician ends a
// test or a sequence (ADR-009).

import ClientScreen from "./ClientScreen";

// Moves keyboard and screen reader users to the heading when the screen appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

function BreakScreen() {
  return (
    <ClientScreen>
      <h1 ref={focusOnShow} tabIndex={-1} className="text-5xl font-bold outline-none">
        Take a break
      </h1>
      <p className="mt-4">Please wait for your clinician to tell you to continue.</p>
    </ClientScreen>
  );
}

export default BreakScreen;
