// Development only (roadmap 5.1): runs one test with the fake ResultStore.

import { useState } from "react";
import type { TestResult } from "../shared/test-module";
import { trailMaking } from "../tests/trail-making";
import { createFakeResultStore, type SavedResult } from "./fake-result-store";

const store = createFakeResultStore();
const { Component: Test } = trailMaking;

function DevTestPage() {
  const [saved, setSaved] = useState<SavedResult[]>([]);

  async function handleComplete(result: TestResult) {
    await store.saveResult(result, { width: window.innerWidth, height: window.innerHeight });
    setSaved([...store.saved]);
  }

  return (
    <>
      <Test sequenceId="dev-sequence" stopRequested={false} onComplete={handleComplete} />
      {saved.length > 0 && <pre className="p-8">{JSON.stringify(saved, null, 2)}</pre>}
    </>
  );
}

export default DevTestPage;
