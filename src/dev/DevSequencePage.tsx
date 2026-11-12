// Development only (roadmap 7.3): runs every test back to back with the fake ResultStore.

import { useState } from "react";
import SoundCheck from "../client/sound-check/SoundCheck";
import SequenceRunner from "../shared/SequenceRunner";
import { testModules } from "../tests/registry";
import { createFakeResultStore } from "./fake-result-store";

const store = createFakeResultStore();

function DevSequencePage() {
  const [heard, setHeard] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!heard) return <SoundCheck onHeard={() => setHeard(true)} />;

  if (finished) {
    const summary = store.saved.map(({ result, screen }) => ({
      testId: result.testId,
      scores: result.scores,
      screen,
    }));

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
