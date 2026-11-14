// Development only (roadmap 5.1): runs one test with the fake ResultStore.
// The sound check comes first, because browsers block sound until a click.
// Keys stand in for the dashboard (roadmap 5.11, 9.5): C is Continue, S is End test.
// Holds and timed parts are logged to the console.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import SoundCheck from "../client/sound-check/SoundCheck";
import type { TestResult } from "../shared/test-module";
import { testModules } from "../tests/registry";
import { createFakeResultStore, type SavedResult } from "./fake-result-store";

const store = createFakeResultStore();
const reportLoadFailed = () => console.warn("Clips failed to load");
const logTimedPartStarted = (part: string) => console.info("timed part started", part);
const logTimedPartEnded = (part: string) => console.info("timed part ended", part);

function DevTestPage() {
  const { testId } = useParams();
  const test = testModules.find((candidate) => candidate.id === testId);
  const [heard, setHeard] = useState(false);
  const [saved, setSaved] = useState<SavedResult[]>([]);
  const [stopRequested, setStopRequested] = useState(false);
  const [holdsReleased, setHoldsReleased] = useState(0);
  const holdsReached = useRef(0);

  const handleHoldReached = useCallback((hold: number) => {
    console.info("hold reached", hold);
    holdsReached.current = Math.max(holdsReached.current, hold);
  }, []);

  // A fake clinician (roadmap 5.11, 9.5). Continue releases every hold reached so far, like the
  // dashboard's button. Waits for the sound check.
  useEffect(() => {
    if (!heard) {
      return;
    }

    function controlOnKey(event: KeyboardEvent) {
      if (event.key === "s") {
        setStopRequested(true);
      }

      if (event.key === "c") {
        setHoldsReleased(holdsReached.current);
      }
    }

    window.addEventListener("keydown", controlOnKey);
    return () => window.removeEventListener("keydown", controlOnKey);
  }, [heard]);

  async function handleComplete(result: TestResult) {
    await store.saveResult(result, { width: window.innerWidth, height: window.innerHeight });
    setSaved([...store.saved]);
  }

  if (!heard) return <SoundCheck onHeard={() => setHeard(true)} />;

  if (saved.length > 0) {
    return (
      <main className="p-8">
        {Object.entries(saved[0].result.sheets).map(([name, svg]) => (
          <a
            key={name}
            href={`data:image/svg+xml,${encodeURIComponent(svg)}`}
            download={`${name}.svg`}
            className="mr-4 underline"
          >
            Download {name}
          </a>
        ))}
        <pre>{JSON.stringify(saved, (key, value) => (key === "sheets" ? undefined : value), 2)}</pre>
      </main>
    );
  }

  if (!test) return <main className="p-8">No test called {testId}.</main>;

  const { Component: Test } = test;

  return (
    <Test
      sequenceId="dev-sequence"
      stopRequested={stopRequested}
      holdsReleased={holdsReleased}
      onHoldReached={handleHoldReached}
      onTimedPartStarted={logTimedPartStarted}
      onTimedPartEnded={logTimedPartEnded}
      onComplete={handleComplete}
      onLoadFailed={reportLoadFailed}
    />
  );
}

export default DevTestPage;
