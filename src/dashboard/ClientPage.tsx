// One client's visits and tests, newest visit first (roadmap 8.6).
// Reads go through RLS, so another practice's client looks the same as one that doesn't exist.

import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { formatDate } from "./formatDate";
import { isUuid } from "./isUuid";
import ResultDetail, { type ResultDetails } from "./ResultDetail";
import { sequenceTests } from "./sequence-tests";
import { sequenceStatusLabels, testStatusLabels } from "./statusLabels";
import { supabase } from "./supabase";
import { useSequencesMade } from "./useSequencesMade";

type Visit = {
  id: string;
  status: string;
  created_at: string;
  sequence_tests: (ResultDetails & { id: string; status: string })[];
};

type Client = { code: string; created_at: string; sequences: Visit[] };

// Each finished load remembers which client it was for.
type Load =
  | { state: "loading" }
  | { state: "failed"; clientId: string }
  | { state: "loaded"; clientId: string; client: Client | null };

const testNames = new Map(sequenceTests.map((test) => [test.id, test.name]));
const summaries = new Map(sequenceTests.map((test) => [test.id, test.summarize]));

const backLinkClass =
  "inline-flex h-12 items-center font-bold text-accent underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";
// The same look as Sign out.
const detailsButtonClass =
  "h-12 rounded-lg border-2 border-accent px-6 font-bold text-accent focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

// raw_data (the full click or answer log) is never read: the page doesn't show it.
// clinicians is whoever stopped the test (empty unless it was stopped).
const columns =
  "code, created_at, sequences(id, status, created_at, sequence_tests(id, practice_id, test_id, status, test_version, started_at, completed_at, screen_width, screen_height, scores, browser_scores, stop_reason, sheets, clinicians(display_name)))";

function ClientPage() {
  const { clientId = "" } = useParams();
  const validId = isUuid(clientId);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const sequencesMade = useSequencesMade();
  // Which tests have their details open. Several can be open at once.
  const [openTests, setOpenTests] = useState<Set<string>>(new Set());

  function toggle(testId: string) {
    setOpenTests((current) => {
      const next = new Set(current);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  }

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    supabase
      .from("clients")
      .select(columns)
      .eq("id", clientId)
      .order("created_at", { referencedTable: "sequences", ascending: false })
      .order("position", { referencedTable: "sequences.sequence_tests" })
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoad(error ? { state: "failed", clientId } : { state: "loaded", clientId, client: data });
      });
    return () => {
      cancelled = true;
    };
    // sequencesMade isn't used inside: it's here so a new sequence re-reads the visits.
  }, [clientId, validId, sequencesMade]);

  // A load for a different client (the address changed) counts as still loading.
  const current = load.state !== "loading" && load.clientId === clientId ? load : null;
  const notFound = !validId || (current?.state === "loaded" && current.client === null);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link to="/dashboard/clients" className={backLinkClass}>
        All clients
      </Link>

      {notFound && (
        <>
          <h1 className="mt-4 text-4xl font-bold">Client not found</h1>
          <p className="mt-4">No client in your practice has this address.</p>
        </>
      )}

      {!notFound && current === null && <p className="mt-8">Loading…</p>}

      {!notFound && current?.state === "failed" && (
        <p role="alert" className="mt-8">
          Couldn't load this client. Check your internet connection and reload the page.
        </p>
      )}

      {!notFound && current?.state === "loaded" && current.client && (
        <>
          <h1 className="mt-4 text-4xl font-bold">{current.client.code}</h1>
          <p className="mt-2 text-ink-muted">Added {formatDate(current.client.created_at)}</p>

          {current.client.sequences.length === 0 && <p className="mt-8">No visits yet.</p>}

          {current.client.sequences.map((visit) => (
            <section key={visit.id} className="mt-10">
              <h2 className="text-2xl font-bold">Visit created {formatDate(visit.created_at)}</h2>
              <p className="mt-1">{sequenceStatusLabels[visit.status] ?? visit.status}</p>
              <table className="mt-3 w-full text-left">
                <thead>
                  <tr className="border-b-2 border-form-gray">
                    <th scope="col" className="py-3 pr-8">Test</th>
                    <th scope="col" className="py-3 pr-8">Status</th>
                    <th scope="col" className="py-3 pr-8">Date</th>
                    <th scope="col" className="py-3 pr-8">Scores</th>
                    <th scope="col" className="py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visit.sequence_tests.map((test) => {
                    const ran = test.status === "completed" || test.status === "stopped";
                    const open = openTests.has(test.id);
                    return (
                      <Fragment key={test.id}>
                        <tr className="border-b border-form-gray">
                          <td className="py-3 pr-8">{testNames.get(test.test_id) ?? test.test_id}</td>
                          <td className="py-3 pr-8">{testStatusLabels[test.status] ?? test.status}</td>
                          <td className="py-3 pr-8">{test.completed_at ? formatDate(test.completed_at) : "—"}</td>
                          <td className="py-3 pr-8">
                            <ul>
                              {test.scores !== null &&
                                (summaries.get(test.test_id)?.(test.scores) ?? []).map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                            </ul>
                          </td>
                          <td className="py-3">
                            {ran && (
                              <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={`detail-${test.id}`}
                                onClick={() => toggle(test.id)}
                                className={detailsButtonClass}
                              >
                                Details
                              </button>
                            )}
                          </td>
                        </tr>
                        {/* Built only while open, so a closed test fetches nothing. */}
                        {ran && (
                          <tr id={`detail-${test.id}`} hidden={!open} className="border-b border-form-gray">
                            <td colSpan={5}>{open && <ResultDetail result={test} />}</td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </>
      )}
    </main>
  );
}

export default ClientPage;
