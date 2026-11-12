// The page behind a client's link, /t/<link-token> (roadmap 7.2).
// Every load of the link starts here, never inside a test (ADR-036).

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { createFakeResultStore } from "../dev/fake-result-store";
import ClientScreen from "../shared/ClientScreen";
import { enterFullScreen } from "../shared/full-screen";
import SequenceRunner from "../shared/SequenceRunner";
import TryAgainScreen from "../shared/TryAgainScreen";
import { testsForIds } from "../tests/registry";
import { checkLink, type LinkCheck } from "./check-link";
import SoundCheck from "./sound-check/SoundCheck";

// Temporary: the real ResultStore replaces this at roadmap 7.7.
const store = createFakeResultStore();

// One message for every refused link, whatever the reason (ADR-037).
function LinkNotWorking() {
  return (
    <ClientScreen>
      <h1 className="text-5xl font-bold">This link isn't working</h1>
      <p className="mt-4">Please tell your clinician.</p>
    </ClientScreen>
  );
}

function ClientPage() {
  const { token = "" } = useParams();
  const [check, setCheck] = useState<LinkCheck | "checking">("checking");
  const [attempt, setAttempt] = useState(0);
  const [heard, setHeard] = useState(false);
  const [finished, setFinished] = useState(false);

  // Ask about the link when the page loads, and again on each "Try again".
  useEffect(() => {
    let ignore = false;
    checkLink(token).then((result) => {
      if (!ignore) setCheck(result);
    });
    return () => {
      ignore = true;
    };
  }, [token, attempt]);

  function tryAgain() {
    setCheck("checking");
    setAttempt((count) => count + 1);
  }

  // Full screen can only come back from a click, in case the client left it (roadmap 7.2).
  function handleHeard() {
    enterFullScreen();
    setHeard(true);
  }

  if (check === "checking") {
    return (
      <ClientScreen>
        <p role="status" className="text-ink-muted">
          Loading…
        </p>
      </ClientScreen>
    );
  }

  if (check.status === "notValid") return <LinkNotWorking />;

  if (check.status === "failed") {
    return <TryAgainScreen onTryAgain={tryAgain} />;
  }

  const tests = testsForIds(check.link.tests);

  // Skipping a test the app doesn't have would leave it missing from the visit with no record.
  if (!tests) return <LinkNotWorking />;

  if (heard) {
    // Temporary: the end screen goes here (roadmap 7.8).
    if (finished || tests.length === 0) {
      return (
        <ClientScreen>
          <p>All done. The end screen will go here.</p>
        </ClientScreen>
      );
    }

    return (
      <SequenceRunner
        sequenceId={check.link.sequenceId}
        tests={tests}
        store={store}
        onFinished={() => setFinished(true)}
      />
    );
  }

  // The Start click unlocks sound and goes full screen: browsers allow both only from a click.
  return (
    <SoundCheck startLabel="Start" onStart={enterFullScreen} onHeard={handleHeard}>
      <div className="mb-8">
        <h1 className="text-5xl font-bold">{check.link.practiceName}</h1>
        <p className="mt-4">
          Welcome. When you press Start, this page will fill your whole screen and you will hear a
          voice.
        </p>
      </div>
    </SoundCheck>
  );
}

export default ClientPage;
