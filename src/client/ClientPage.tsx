// The page behind a client's link, /t/<link-token> (roadmap 7.2).
// Every load of the link starts here, never inside a test (ADR-036).

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { enterFullScreen } from "../shared/full-screen";
import { checkLink, type LinkCheck } from "./check-link";
import SoundCheck from "./sound-check/SoundCheck";
import TryAgainScreen from "./TryAgainScreen";

function ClientPage() {
  const { token = "" } = useParams();
  const [check, setCheck] = useState<LinkCheck | "checking">("checking");
  const [attempt, setAttempt] = useState(0);
  const [heard, setHeard] = useState(false);

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
      <main className="mx-auto max-w-2xl p-8">
        <p role="status" className="text-ink-muted">
          Loading…
        </p>
      </main>
    );
  }

  // One message for every refused link, whatever the reason (ADR-037).
  if (check.status === "notValid") {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-5xl font-bold">This link isn't working</h1>
        <p className="mt-4">Please tell your clinician.</p>
      </main>
    );
  }

  if (check.status === "failed") {
    return <TryAgainScreen onTryAgain={tryAgain} />;
  }

  // Temporary: the sequence runner goes here (roadmap 7.3).
  if (heard) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <p>Sound check done. The tests will start here.</p>
      </main>
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
