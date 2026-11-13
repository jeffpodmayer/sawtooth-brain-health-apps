// One finished test's full detail, opened from its row on the client page (roadmap 8.7):
// stop reason, times, test version, screen size, the browser-scores flag, the full scores and the sheets.

import type { Json } from "../../supabase/functions/_shared/database.types.ts";
import { formatDateTime } from "./formatDate";
import { sequenceTests } from "./sequence-tests";
import SheetImages from "./SheetImages";
import { stopReasonLabels } from "./statusLabels";
import TestNotes from "./TestNotes";

export type ResultDetails = {
  id: string;
  practice_id: string;
  test_id: string;
  test_version: string | null;
  started_at: string | null;
  completed_at: string | null;
  screen_width: number | null;
  screen_height: number | null;
  scores: Json | null;
  browser_scores: Json | null;
  stop_reason: string | null;
  clinicians: { display_name: string } | null; // whoever stopped the test
  sheets: Json | null;
};

const testNames = new Map(sequenceTests.map((test) => [test.id, test.name]));
const details = new Map(sequenceTests.map((test) => [test.id, test.detail]));

// The database requires the times, version and screen size on every completed or stopped test
// (sequence_tests_result_check). The "—" fallbacks only satisfy TypeScript, which can't know that.
function ResultDetail({ result }: { result: ResultDetails }) {
  return (
    <div className="py-4">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2">
        {result.stop_reason && (
          <>
            <dt className="font-bold">Stop reason</dt>
            <dd>{stopReasonLabels[result.stop_reason] ?? result.stop_reason}</dd>
            <dt className="font-bold">Stopped by</dt>
            <dd>{result.clinicians?.display_name ?? "—"}</dd>
          </>
        )}
        <dt className="font-bold">Started</dt>
        <dd>{result.started_at ? formatDateTime(result.started_at) : "—"}</dd>
        <dt className="font-bold">Finished</dt>
        <dd>{result.completed_at ? formatDateTime(result.completed_at) : "—"}</dd>
        <dt className="font-bold">Test version</dt>
        <dd>{result.test_version ?? "—"}</dd>
        <dt className="font-bold">Screen size</dt>
        <dd>
          {result.screen_width && result.screen_height ? `${result.screen_width} × ${result.screen_height} px` : "—"}
        </dd>
      </dl>

      <h3 className="mt-6 text-xl font-bold">Full scores</h3>
      {result.browser_scores !== null && (
        <div className="mt-3 rounded-lg border-2 border-ink p-4">
          <p className="font-bold">The browser's scores didn't match the server's.</p>
          <p className="mt-1">
            The scores below are the server's, worked out again from the saved log. The browser's are kept below.
          </p>
          <details className="mt-2">
            <summary className="inline-flex h-12 cursor-pointer items-center font-bold text-accent underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent">
              Show the browser's scores
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-base">
              {JSON.stringify(result.browser_scores, null, 2)}
            </pre>
          </details>
        </div>
      )}
      <ul className="mt-2">
        {result.scores !== null &&
          (details.get(result.test_id)?.(result.scores) ?? []).map((line) => <li key={line}>{line}</li>)}
      </ul>

      <TestNotes sequenceTestId={result.id} practiceId={result.practice_id} />

      <SheetImages
        testId={result.test_id}
        testName={testNames.get(result.test_id) ?? result.test_id}
        sheets={result.sheets}
      />
    </div>
  );
}

export default ResultDetail;
