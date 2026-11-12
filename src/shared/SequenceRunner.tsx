// Runs a sequence's tests in order, saving each result as it finishes (roadmap 7.3).
// It only uses the plug-in contract, so it never knows how a test works or is scored (ADR-001).

import { useCallback, useState } from "react";
import type { ResultStore } from "./result-store";
import type { TestModule, TestResult } from "./test-module";
import TryAgainScreen from "./TryAgainScreen";

type SequenceRunnerProps = {
  sequenceId: string;
  tests: TestModule[];
  store: ResultStore;
  onFinished: () => void;
};

function SequenceRunner({ sequenceId, tests, store, onFinished }: SequenceRunnerProps) {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const handleLoadFailed = useCallback(() => setLoadFailed(true), []);

  async function handleComplete(result: TestResult) {
    await store.saveResult(result, { width: window.innerWidth, height: window.innerHeight });

    if (index + 1 < tests.length) {
      setIndex(index + 1);
    } else {
      onFinished();
    }
  }

  function tryAgain() {
    setLoadFailed(false);
    setAttempt((count) => count + 1);
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
