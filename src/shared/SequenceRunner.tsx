// Runs a sequence's tests in order, saving each result as it finishes (roadmap 7.3).
// It only uses the plug-in contract, so it never knows how a test works or is scored (ADR-001).

import { useCallback, useState } from "react";
import BreakScreen from "./BreakScreen";
import { enterFullScreen } from "./full-screen";
import type { ResultStore } from "./result-store";
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
  const handleLoadFailed = useCallback(() => setLoadFailed(true), []);

  async function handleComplete(result: TestResult) {
    await store.saveResult(result, { width: window.innerWidth, height: window.innerHeight });

    if (index + 1 < tests.length) {
      setIndex(index + 1);
      setOnBreak(true);
    } else {
      onFinished();
    }
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
