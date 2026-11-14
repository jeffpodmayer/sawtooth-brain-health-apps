// One client's visits, newest first (roadmap 8.6, redesigned at 8.9). Each visit opens to show its tests.
// Reads go through RLS, so another practice's client looks the same as one that doesn't exist.

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import Chevron from "./Chevron";
import CopyLinkButton from "./CopyLinkButton";
import EndVisitButton from "./EndVisitButton";
import { formatDate } from "./formatDate";
import GenerateSequence from "./GenerateSequence";
import { isUuid } from "./isUuid";
import { testsById } from "./sequence-tests";
import { supabase } from "./supabase";
import TestBlock, { type VisitTest } from "./TestBlock";

type Visit = {
  id: string;
  status: string;
  created_at: string;
  link_token: string;
  clinicians: { display_name: string } | null; // whoever created the visit
  sequence_tests: VisitTest[];
};

type Client = { code: string; sequences: Visit[] };

// Each finished load remembers which client it was for.
type Load =
  | { state: "loading" }
  | { state: "failed"; clientId: string }
  | { state: "loaded"; clientId: string; client: Client | null };

const breadcrumbLinkClass =
  "rounded-lg font-semibold text-accent underline-offset-8 hover:text-accent-strong hover:underline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

// Of raw_data (the full click or answer log), only the browser is read (ADR-047); the log itself isn't.
// A visit's clinicians is who created it; a test's is who stopped it (empty unless stopped).
const columns =
  "code, sequences(id, status, created_at, link_token, clinicians(display_name), sequence_tests(id, practice_id, test_id, status, test_version, started_at, completed_at, screen_width, screen_height, scores, browser_scores, stop_reason, stop_requested_at, holds_reached, holds_released, began_at, timed_part, timed_part_started_at, sheets, browser:raw_data->browser, clinicians(display_name)))";

const hasResults = (visit: Visit) =>
  visit.sequence_tests.some((test) => test.status === "completed" || test.status === "stopped");

// The running test's own stop reasons: the first test still pending (ADR-048).
function runningTestReasons(visit: Visit): Record<string, string> {
  const running = visit.sequence_tests.find((test) => test.status === "pending");
  return (running && testsById.get(running.test_id)?.stopReasons) ?? {};
}

function ClientPage() {
  const { clientId = "" } = useParams();
  const validId = isUuid(clientId);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [reloads, setReloads] = useState(0); // goes up after a new sequence, so the visits are read again
  // Which visits are open. Several can be open at once.
  const [openVisits, setOpenVisits] = useState<Set<string>>(new Set());
  const openedFor = useRef<string | null>(null); // the client whose visits were last opened by default

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
        // On a client's first load, any open visit and the newest visit with results start open.
        // A re-read (after New sequence or a stop) keeps what the clinician has opened.
        if (!error && openedFor.current !== clientId) {
          openedFor.current = clientId;
          const first = data?.sequences.find(hasResults);
          const live = data?.sequences.filter((visit) => visit.status === "open").map((visit) => visit.id) ?? [];
          setOpenVisits(new Set([...live, ...(first ? [first.id] : [])]));
        }
      });
    return () => {
      cancelled = true;
    };
    // reloads isn't used inside: it's here so a new sequence re-reads the visits.
  }, [clientId, validId, reloads]);

  function toggleVisit(visitId: string) {
    setOpenVisits((current) => {
      const next = new Set(current);
      if (next.has(visitId)) next.delete(visitId);
      else next.add(visitId);
      return next;
    });
  }

  // A load for a different client (the address changed) counts as still loading.
  const current = load.state !== "loading" && load.clientId === clientId ? load : null;
  const notFound = !validId || (current?.state === "loaded" && current.client === null);
  const client = current?.state === "loaded" ? current.client : null;
  const visits = client?.sequences ?? [];

  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      {/* The breadcrumb is the page's title: "Clients" links back to the list, and the client ID is the heading. */}
      <div className="flex items-center justify-between gap-4">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-baseline gap-3 text-4xl">
            <li>
              <Link to="/dashboard/clients" className={breadcrumbLinkClass}>
                Clients
              </Link>
            </li>
            {(client || notFound) && (
              <>
                <li aria-hidden="true" className="text-ink-muted">
                  /
                </li>
                <li aria-current="page">
                  <h1 className="font-semibold">{client ? client.code : "Client not found"}</h1>
                </li>
              </>
            )}
          </ol>
        </nav>
        {client && (
          <GenerateSequence
            look="outline"
            clientCode={client.code}
            onCreated={() => setReloads((count) => count + 1)}
          />
        )}
      </div>

      {notFound && <p className="mt-4">No client in your practice has this address.</p>}

      {!notFound && current === null && <p className="mt-8">Loading…</p>}

      {!notFound && current?.state === "failed" && (
        <p role="alert" className="mt-8">
          Couldn't load this client. Check your internet connection and reload the page.
        </p>
      )}

      {client && (
        <>
          {visits.length === 0 && <p className="mt-8">No visits yet.</p>}

          {visits.length > 0 && (
            <>
              <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
                {visits.map((visit) => {
                  const open = openVisits.has(visit.id);
                  // The running test: the first one still pending in an open visit (ADR-048).
                  const runningId =
                    visit.status === "open" ? visit.sequence_tests.find((test) => test.status === "pending")?.id : undefined;
                  return (
                    <section key={visit.id} className="border-b border-line last:border-b-0">
                      <div className="flex items-center gap-4 pr-6 hover:bg-hover">
                        <h2 className="flex-1">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={`visit-${visit.id}`}
                            onClick={() => toggleVisit(visit.id)}
                            className="flex w-full items-center gap-4 px-6 py-4 text-left focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent"
                          >
                            <Chevron open={open} />
                            <span className="flex-1">
                              <span className="block font-semibold">{formatDate(visit.created_at)}</span>
                              <span className="block text-base text-ink-muted">
                                Created by {visit.clinicians?.display_name ?? "—"}
                              </span>
                            </span>
                          </button>
                        </h2>
                        {/* A visit's link works only while it's open (ADR-008). */}
                        {visit.status === "open" && <CopyLinkButton linkToken={visit.link_token} />}
                        {visit.status === "open" && (
                          <EndVisitButton
                            sequenceId={visit.id}
                            subtitle={`${client.code} · ${formatDate(visit.created_at)}`}
                            testReasons={runningTestReasons(visit)}
                            onEnded={() => setReloads((count) => count + 1)}
                          />
                        )}
                      </div>
                      <div id={`visit-${visit.id}`} hidden={!open} className="pb-2">
                        {open &&
                          visit.sequence_tests.map((test) => (
                            <div key={test.id}>
                              <TestBlock
                                test={test}
                                clientCode={client.code}
                                visitCreatedAt={visit.created_at}
                                running={test.id === runningId}
                                onChanged={() => setReloads((count) => count + 1)}
                              />
                            </div>
                          ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

export default ClientPage;
