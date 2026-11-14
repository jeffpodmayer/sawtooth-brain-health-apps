// Shown before the first test while it waits at its first hold (roadmap 9.5, ADR-050), right after the
// sound check. Later tests show the break screen instead. No button: the clinician's Continue on the
// dashboard starts the test. The wording awaits the clinicians.

import ClientScreen from "./ClientScreen";

// Moves keyboard and screen reader users to the heading when the screen appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

function WaitScreen() {
  return (
    <ClientScreen>
      <h1 ref={focusOnShow} tabIndex={-1} className="text-5xl font-bold outline-none">
        Hang tight!
      </h1>
      <p className="mt-4">Your clinician will initiate the next step.</p>
    </ClientScreen>
  );
}

export default WaitScreen;
