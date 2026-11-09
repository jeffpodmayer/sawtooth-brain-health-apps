// Development only (roadmap 5.1): runs one test with the fake ResultStore.
// The sound check comes first, because browsers block sound until a click.

import { useEffect, useState } from "react";
import SoundCheck from "../client/sound-check/SoundCheck";
import type { TestResult } from "../shared/test-module";
import { trailMaking } from "../tests/trail-making";
import { createFakeResultStore, type SavedResult } from "./fake-result-store";

const store = createFakeResultStore();
const { Component: Test } = trailMaking;

function DevTestPage() {
  const [heard, setHeard] = useState(false);
  const [saved, setSaved] = useState<SavedResult[]>([]);
  const [stopRequested, setStopRequested] = useState(false);

  // A fake clinician's stop (roadmap 5.11): press S during the test. Waits for the sound check.
  useEffect(() => {
    if (!heard) {
      return;
    }

    function stopOnKey(event: KeyboardEvent) {
      if (event.key === "s") {
        setStopRequested(true);
      }
    }

    window.addEventListener("keydown", stopOnKey);
    return () => window.removeEventListener("keydown", stopOnKey);
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

  return <Test sequenceId="dev-sequence" stopRequested={stopRequested} onComplete={handleComplete} />;
}

export default DevTestPage;
