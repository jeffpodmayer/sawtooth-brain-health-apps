// One client's visits and tests, newest visit first (roadmap 8.6).
// Reads go through RLS, so another practice's client looks the same as one that doesn't exist.

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { Json } from "../../supabase/functions/_shared/database.types.ts";
import { formatDate } from "./formatDate";
import { sequenceTests } from "./sequence-tests";
import { sequenceStatusLabels, testStatusLabels } from "./statusLabels";
import { supabase } from "./supabase";
import { useSequencesMade } from "./useSequencesMade";

type Visit = {
  id: string;
  status: string;
  created_at: string;
  sequence_tests: { id: string; test_id: string; status: string; completed_at: string | null; scores: Json | null }[];
};

type Client = { code: string; created_at: string; sequences: Visit[] };

// Each finished load remembers which client it was for.
type Load =
  | { state: "loading" }
  | { state: "failed"; clientId: string }
  | { state: "loaded"; clientId: string; client: Client | null };

const ID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const testNames = new Map(sequenceTests.map((test) => [test.id, test.name]));
const summaries = new Map(sequenceTests.map((test) => [test.id, test.summarize]));

const backLinkClass =
  "inline-flex h-12 items-center font-bold text-accent underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

function ClientPage() {
  const { clientId = "" } = useParams();
  const validId = ID_FORMAT.test(clientId);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const sequencesMade = useSequencesMade();

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    supabase
      .from("clients")
      .select("code, created_at, sequences(id, status, created_at, sequence_tests(id, test_id, status, completed_at, scores))")
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
                    <th scope="col" className="py-3">Scores</th>
                  </tr>
                </thead>
                <tbody>
                  {visit.sequence_tests.map((test) => (
                    <tr key={test.id} className="border-b border-form-gray">
                      <td className="py-3 pr-8">{testNames.get(test.test_id) ?? test.test_id}</td>
                      <td className="py-3 pr-8">{testStatusLabels[test.status] ?? test.status}</td>
                      <td className="py-3 pr-8">{test.completed_at ? formatDate(test.completed_at) : "—"}</td>
                      <td className="py-3">
                        <ul>
                          {test.scores !== null &&
                            (summaries.get(test.test_id)?.(test.scores) ?? []).map((line) => <li key={line}>{line}</li>)}
                        </ul>
                      </td>
                    </tr>
                  ))}
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
