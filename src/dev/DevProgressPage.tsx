// Development only (roadmap 9.3): stands in for the client's tab until the tests use holds and stops (9.5).
// Open /dev/progress/<link-token>?test=<test-id> with the dashboard open on that client in another window.
// The buttons report through report-progress; each "check now" ping (and each connect) asks check-status.

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { checkStatus } from "../client/check-status";
import { listenForChecks } from "../client/listen-for-checks";
import { reportProgress, type ProgressReport } from "../client/report-progress";

// A log line with the time it happened, for reading only (nothing here is measured).
function stamped(line: string): string {
  return `${new Date().toLocaleTimeString()}  ${line}`;
}

const buttonClass = "rounded border border-ink px-4 py-2";

function DevProgressPage() {
  const { token = "" } = useParams();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get("test") ?? "trail-making";
  const [log, setLog] = useState<string[]>([]);
  const [hold, setHold] = useState(1);
  const [part, setPart] = useState("partA");

  // Listen while the page is open; each ping is answered by asking the server.
  useEffect(
    () =>
      listenForChecks(token, async () => {
        const result = await checkStatus(token, testId);
        setLog((lines) => [stamped(`check → ${JSON.stringify(result)}`), ...lines]);
      }),
    [token, testId],
  );

  async function send(report: ProgressReport) {
    const saved = await reportProgress(token, testId, report);
    setLog((lines) => [stamped(`report ${JSON.stringify(report)} → ${saved ? "saved" : "NOT saved"}`), ...lines]);
  }

  return (
    <main className="p-6 text-lg">
      <h1 className="text-2xl font-bold">Progress check: {testId}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={buttonClass} onClick={() => send({ event: "began" })}>
          Began
        </button>
        <label>
          Hold{" "}
          <input type="number" min={1} value={hold} onChange={(e) => setHold(Number(e.target.value))}
            className="w-16 rounded border border-ink px-2 py-1" />
        </label>
        <button type="button" className={buttonClass} onClick={() => send({ event: "holdReached", hold })}>
          Reach hold
        </button>
        <label>
          Part{" "}
          <input value={part} onChange={(e) => setPart(e.target.value)}
            className="w-28 rounded border border-ink px-2 py-1" />
        </label>
        <button type="button" className={buttonClass} onClick={() => send({ event: "timedPartStarted", part })}>
          Start part
        </button>
        <button type="button" className={buttonClass} onClick={() => send({ event: "timedPartEnded", part })}>
          End part
        </button>
      </div>
      <ol className="mt-6 font-mono text-base">
        {log.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    </main>
  );
}

export default DevProgressPage;
