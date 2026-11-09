// Development only (roadmap 5.1): runs one test with the fake ResultStore.
// The sound check comes first, because browsers block sound until a click.

import { useState } from "react";
import SoundCheck from "../client/sound-check/SoundCheck";
import type { TestResult } from "../shared/test-module";
import { trailMaking } from "../tests/trail-making";
import { createFakeResultStore, type SavedResult } from "./fake-result-store";

const store = createFakeResultStore();
const { Component: Test } = trailMaking;

function DevTestPage() {
  const [heard, setHeard] = useState(false);
  const [saved, setSaved] = useState<SavedResult[]>([]);

  async function handleComplete(result: TestResult) {
    await store.saveResult(result, { width: window.innerWidth, height: window.innerHeight });
    setSaved([...store.saved]);
  }

  if (!heard) return <SoundCheck onHeard={() => setHeard(true)} />;

  if (saved.length > 0) return <pre className="p-8">{JSON.stringify(saved, null, 2)}</pre>;

  return <Test sequenceId="dev-sequence" stopRequested={false} onComplete={handleComplete} />;
}

export default DevTestPage;
