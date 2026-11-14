// Runs a sequence's tests in order, saving each result as it finishes (roadmap 7.3), and carries the
// clinician's Stop and Continue to the running test (roadmap 9.5, ADR-049, ADR-050).
// It only uses the plug-in contract and the ResultStore, so it never knows how a test works or is scored (ADR-001).

import { useCallback, useEffect, useRef, useState } from "react";
import BreakScreen from "./BreakScreen";
import ClientScreen from "./ClientScreen";
import type { ResultStore, SaveOutcome, ScreenSize, TestStatus } from "./result-store";
import type { TestModule, TestResult } from "./test-module";
import TryAgainScreen from "./TryAgainScreen";
import WaitScreen from "./WaitScreen";

type SequenceRunnerProps = {
  sequenceId: string;
  tests: TestModule[];
  store: ResultStore;
  onFinished: () => void;
};

// A finished test's result, kept until it is saved, so Try again sends the same one.
type Unsaved = {
  result: TestResult;
  screen: ScreenSize;
};

function SavingScreen() {
  return (
    <ClientScreen>
      <p role="status" className="text-ink-muted">
        Saving…
      </p>
    </ClientScreen>
  );
}

// Before the server's first answer about a test: nothing released, nothing stopped.
const noAnswerYet: TestStatus = { stopRequested: false, holdsReleased: 0, sequenceOpen: true };

function SequenceRunner({ sequenceId, tests, store, onFinished }: SequenceRunnerProps) {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [unsaved, setUnsaved] = useState<Unsaved | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [notBegunTry, setNotBegunTry] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answer, setAnswer] = useState<{ testId: string; status: TestStatus } | null>(null);
  const handleLoadFailed = useCallback(() => setLoadFailed(true), []);

  // The highest hold reported for the running test, so a repeat (e.g. after Try again) isn't sent.
  const holdsReported = useRef(0);

  const { id, Component: Test } = tests[index];
  const status = answer?.testId === id ? answer.status : noAnswerYet;

  // Every test's first hold comes before it starts (ADR-050). Until Continue releases it, the client
  // sees the wait screen (first test) or the break screen, and the test isn't shown, so a stop then means the test never began.
  const begun = status.holdsReleased >= 1;
  const answeringNotBegun = status.stopRequested && !begun;

  // Arriving at a test: tell the dashboard, reach its first hold, and watch for Stop and Continue.
  useEffect(() => {
    holdsReported.current = 1;
    store.reportProgress(id, { event: "began" });
    store.reportProgress(id, { event: "holdReached", hold: 1 });
    return store.watchTest(id, (next) => setAnswer({ testId: id, status: next }));
  }, [store, id]);

  const handleHoldReached = useCallback(
    (hold: number) => {
      if (hold <= holdsReported.current) return;
      holdsReported.current = hold;
      store.reportProgress(id, { event: "holdReached", hold });
    },
    [store, id],
  );

  const handleTimedPartStarted = useCallback(
    (part: string) => store.reportProgress(id, { event: "timedPartStarted", part }),
    [store, id],
  );

  const handleTimedPartEnded = useCallback(
    (part: string) => store.reportProgress(id, { event: "timedPartEnded", part }),
    [store, id],
  );

  // Once a save lands. The server says whether the visit is still open: after the last test, or
  // End whole sequence, it isn't, and the client goes to the end screen (ADR-049).
  const moveOn = useCallback(
    (outcome: SaveOutcome) => {
      if (outcome.sequenceOpen && index + 1 < tests.length) {
        setIndex(index + 1);
      } else {
        setFinished(true);
        onFinished();
      }
    },
    [index, tests.length, onFinished],
  );

  // Moves on only once the result is saved. A failed save offers Try again,
  // never a retake: the test has finished and its result is kept here.
  async function save({ result, screen }: Unsaved) {
    setSaveFailed(false);
    let outcome: SaveOutcome;
    try {
      outcome = await store.saveResult(result, screen);
    } catch {
      setSaveFailed(true);
      return;
    }

    setUnsaved(null);
    moveOn(outcome);
  }

  function handleComplete(result: TestResult) {
    // Measured as the test ends, so a retried save sends the same size.
    const finishedTest = { result, screen: { width: window.innerWidth, height: window.innerHeight } };
    setUnsaved(finishedTest);
    void save(finishedTest);
  }

  // A stop before the first Continue: the test never began, so the answer is "not begun" (ADR-049).
  // Sent again on each Try again. A late answer for a test the runner has left is dropped.
  useEffect(() => {
    if (!answeringNotBegun || finished) return;

    let current = true;
    store.saveNotBegun(id).then(
      (outcome) => {
        if (current) moveOn(outcome);
      },
      () => {
        if (current) setSaveFailed(true);
      },
    );

    return () => {
      current = false;
    };
  }, [answeringNotBegun, finished, store, id, moveOn, notBegunTry]);

  function tryNotBegunAgain() {
    setSaveFailed(false);
    setNotBegunTry((count) => count + 1);
  }

  function tryAgain() {
    setLoadFailed(false);
    setAttempt((count) => count + 1);
  }

  // The client page swaps in the end screen.
  if (finished) return null;

  if (unsaved) {
    if (saveFailed) return <TryAgainScreen onTryAgain={() => save(unsaved)} />;

    return <SavingScreen />;
  }

  if (answeringNotBegun) {
    if (saveFailed) return <TryAgainScreen onTryAgain={tryNotBegunAgain} />;

    return <SavingScreen />;
  }

  if (loadFailed) return <TryAgainScreen onTryAgain={tryAgain} />;

  if (!begun) return index === 0 ? <WaitScreen /> : <BreakScreen />;

  return (
    <Test
      key={`${id}-${attempt}`}
      sequenceId={sequenceId}
      stopRequested={status.stopRequested}
      holdsReleased={status.holdsReleased}
      onHoldReached={handleHoldReached}
      onTimedPartStarted={handleTimedPartStarted}
      onTimedPartEnded={handleTimedPartEnded}
      onComplete={handleComplete}
      onLoadFailed={handleLoadFailed}
    />
  );
}

export default SequenceRunner;
