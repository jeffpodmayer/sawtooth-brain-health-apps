// Development only (roadmap 7.3, 9.5): runs every test back to back with the fake ResultStore.
// Keys stand in for the dashboard, after the sound check: C is Continue, S is End test,
// E is End whole sequence, K is Trail Making's Skip Part A (ADR-055).

import { useEffect, useState } from "react";
import SoundCheck from "../client/sound-check/SoundCheck";
import SequenceRunner from "../shared/SequenceRunner";
import { testModules } from "../tests/registry";
import * as trailMaking from "../tests/trail-making/test-info";
import { createFakeResultStore } from "./fake-result-store";

const store = createFakeResultStore();

const controls: Record<string, () => void> = {
  c: () => store.continueTest(),
  s: () => store.stopTest(),
  e: () => store.endSequence(),
  k: () => store.skipStep("partA", trailMaking.skips.partA.toHold),
};

function DevSequencePage() {
  const [heard, setHeard] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!heard) {
      return;
    }

    function controlOnKey(event: KeyboardEvent) {
      controls[event.key]?.();
    }

    window.addEventListener("keydown", controlOnKey);
    return () => window.removeEventListener("keydown", controlOnKey);
  }, [heard]);

  if (!heard) return <SoundCheck onHeard={() => setHeard(true)} />;

  if (finished) {
    const summary = {
      saved: store.saved.map(({ result, screen }) => ({
        testId: result.testId,
        scores: result.scores,
        stop: result.rawData.stop,
        screen,
      })),
      notBegun: store.notBegun,
    };

    return (
      <main className="p-8">
        <pre>{JSON.stringify(summary, null, 2)}</pre>
      </main>
    );
  }

  return (
    <SequenceRunner
      sequenceId="dev-sequence"
      tests={testModules}
      store={store}
      onFinished={() => setFinished(true)}
    />
  );
}

export default DevSequencePage;
