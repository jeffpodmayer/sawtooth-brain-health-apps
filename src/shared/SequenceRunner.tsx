// Runs a sequence's tests in order, saving each result as it finishes (roadmap 7.3).
// It only uses the plug-in contract, so it never knows how a test works or is scored (ADR-001).

import { useCallback, useState } from "react";
import BreakScreen from "./BreakScreen";
import ClientScreen from "./ClientScreen";
import { enterFullScreen } from "./full-screen";
import type { ResultStore, ScreenSize } from "./result-store";
import type { TestModule, TestResult } from "./test-module";
import TryAgainScreen from "./TryAgainScreen";

type SequenceRunnerProps = {
  sequenceId: string;
  tests: TestModule[];
  store: ResultStore;
  // Lets a clinician hold the next test until they unlock it (roadmap 9.2). Off for now.
  breakLocked?: boolean;
  onFinished: () => void;
};

// A finished test's result, kept until it is saved, so Try again sends the same one.
type Unsaved = {
  result: TestResult;
  screen: ScreenSize;
};

function SequenceRunner({
  sequenceId,
  tests,
  store,
  breakLocked = false,
  onFinished,
}: SequenceRunnerProps) {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [unsaved, setUnsaved] = useState<Unsaved | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const handleLoadFailed = useCallback(() => setLoadFailed(true), []);

  // Moves on only once the result is saved. A failed save offers Try again,
  // never a retake: the test has finished and its result is kept here.
  async function save({ result, screen }: Unsaved) {
    setSaveFailed(false);
    try {
      await store.saveResult(result, screen);
    } catch {
      setSaveFailed(true);
      return;
    }

    setUnsaved(null);
    if (index + 1 < tests.length) {
      setIndex(index + 1);
      setOnBreak(true);
    } else {
      onFinished();
    }
  }

  function handleComplete(result: TestResult) {
    // Measured as the test ends, so a retried save sends the same size.
    const finished = { result, screen: { width: window.innerWidth, height: window.innerHeight } };
    setUnsaved(finished);
    save(finished);
  }

  function tryAgain() {
    setLoadFailed(false);
    setAttempt((count) => count + 1);
  }

  // Full screen can only come back from a click, in case the client left it (ADR-038).
  function continueAfterBreak() {
    enterFullScreen();
    setOnBreak(false);
  }

  if (onBreak) return <BreakScreen locked={breakLocked} onContinue={continueAfterBreak} />;

  if (unsaved) {
    if (saveFailed) return <TryAgainScreen onTryAgain={() => save(unsaved)} />;

    return (
      <ClientScreen>
        <p role="status" className="text-ink-muted">
          Saving…
        </p>
      </ClientScreen>
    );
  }

  if (loadFailed) return <TryAgainScreen onTryAgain={tryAgain} />;

  const { id, Component: Test } = tests[index];

  // stopRequested stays false until the stop button exists (Phase 9).
  return (
    <Test
      key={`${id}-${attempt}`}
      sequenceId={sequenceId}
      stopRequested={false}
      onComplete={handleComplete}
      onLoadFailed={handleLoadFailed}
    />
  );
}

export default SequenceRunner;
