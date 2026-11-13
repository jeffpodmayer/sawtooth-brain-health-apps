// Results list (roadmap 8.5): every test that ran, grouped under its client code.
// Reads go through RLS, so a clinician only ever sees their own practice.

import { useEffect, useState } from "react";
import { formatDate } from "./formatDate";
import { listResults, type ListOptions, type ResultRow } from "./results-list";
import { sequenceTests } from "./sequence-tests";
import { supabase } from "./supabase";

type Load =
  | { state: "loading" }
  | { state: "failed" }
  | { state: "loaded"; rows: ResultRow[] };

const testNames = new Map(sequenceTests.map((test) => [test.id, test.name]));
const statusLabels = { completed: "Completed", stopped: "Stopped" } as const;

const noFilters: ListOptions = { search: "", fromDate: "", toDate: "" };

// The same look as the Generate Test Sequence form.
const fieldClass =
  "mt-2 block h-14 w-full rounded-lg border-2 border-ink-muted bg-white px-4 font-normal text-ink focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";
const clearButtonClass =
  "h-14 rounded-lg border-2 border-accent px-8 font-bold text-accent focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

type Fetched = {
  id: string;
  test_id: string;
  status: string;
  completed_at: string | null;
  sequences: { clients: { code: string } };
};

// The database guarantees a completed or stopped test has a completed_at (sequence_tests_result_check).
// The check here only satisfies TypeScript, which can't know that.
function toResultRow(row: Fetched): ResultRow[] {
  if ((row.status !== "completed" && row.status !== "stopped") || row.completed_at === null) return [];
  return [
    {
      id: row.id,
      clientCode: row.sequences.clients.code,
      testId: row.test_id,
      status: row.status,
      completedAt: row.completed_at,
    },
  ];
}

function ResultsPage() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [options, setOptions] = useState<ListOptions>(noFilters);

  // Changes some options, keeping the rest.
  function change(update: Partial<ListOptions>) {
    setOptions((current) => ({ ...current, ...update }));
  }

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("sequence_tests")
      .select("id, test_id, status, completed_at, sequences(clients(code))")
      .in("status", ["completed", "stopped"])
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoad(error ? { state: "failed" } : { state: "loaded", rows: data.flatMap(toResultRow) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = load.state === "loaded" ? listResults(load.rows, options) : [];
  const shown = groups.reduce((total, group) => total + group.results.length, 0);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-4xl font-bold">Results</h1>

      {load.state === "loading" && <p className="mt-8">Loading…</p>}

      {load.state === "failed" && (
        <p role="alert" className="mt-8">
          Couldn't load the results. Check your internet connection and reload the page.
        </p>
      )}

      {load.state === "loaded" && load.rows.length === 0 && <p className="mt-8">No results yet.</p>}

      {load.state === "loaded" && load.rows.length > 0 && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block font-bold">
              Client code
              <input
                type="search"
                value={options.search}
                onChange={(event) => change({ search: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block font-bold">
              From
              <input
                type="date"
                value={options.fromDate}
                onChange={(event) => change({ fromDate: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block font-bold">
              To
              <input
                type="date"
                value={options.toDate}
                onChange={(event) => change({ toDate: event.target.value })}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p role="status">
              {shown === 1 ? "1 result" : `${shown} results`}, {groups.length === 1 ? "1 client" : `${groups.length} clients`}
            </p>
            <button
              type="button"
              onClick={() => setOptions(noFilters)}
              className={clearButtonClass}
            >
              Clear search and dates
            </button>
          </div>

          {groups.length === 0 && <p className="mt-8">No results match. Try another client code or other dates.</p>}
        </>
      )}

      {groups.map((group) => (
        <section key={group.clientCode} className="mt-10">
          <h2 className="text-2xl font-bold">{group.clientCode}</h2>
          <table className="mt-3 w-full text-left">
            <thead>
              <tr className="border-b-2 border-form-gray">
                <th scope="col" className="py-3 pr-8">Date</th>
                <th scope="col" className="py-3 pr-8">Test</th>
                <th scope="col" className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {group.results.map((result) => (
                <tr key={result.id} className="border-b border-form-gray">
                  <td className="py-3 pr-8">{formatDate(result.completedAt)}</td>
                  <td className="py-3 pr-8">{testNames.get(result.testId) ?? result.testId}</td>
                  <td className="py-3">{statusLabels[result.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}

export default ResultsPage;
