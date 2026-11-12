// Shown between tests (roadmap 7.4). The client and clinician can talk, then the client goes on.
// No end or skip button: only a clinician ends a test or a sequence (ADR-009).

import ClientScreen from "./ClientScreen";

const buttonClass =
  "mt-8 h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

// Moves keyboard and screen reader users to the heading when the screen appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

type BreakScreenProps = {
  // Hides Continue until the clinician unlocks it. Always false until roadmap 9.2.
  locked: boolean;
  onContinue: () => void;
};

function BreakScreen({ locked, onContinue }: BreakScreenProps) {
  return (
    <ClientScreen>
      <h1 ref={focusOnShow} tabIndex={-1} className="text-5xl font-bold outline-none">
        Take a break
      </h1>
      <p className="mt-4">Please wait for your clinician to tell you to continue.</p>
      {!locked && (
        <button type="button" onClick={onContinue} className={buttonClass}>
          Continue
        </button>
      )}
    </ClientScreen>
  );
}

export default BreakScreen;
