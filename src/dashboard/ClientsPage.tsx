// Clients list (roadmap 8.3, redesigned at 8.9): newest first, with a search by client ID.
// New clients are added in Generate Test Sequence (8.4). Reads go through RLS, so a clinician
// only ever sees their own practice.

import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { ClientSummary } from "./client-search";
import { loadClients } from "./clients";
import ClientsMenu from "./ClientsMenu";
import { formatDate } from "./formatDate";
import GenerateSequence from "./GenerateSequence";
import { fieldClass } from "./styles";

type Load = { state: "loading" } | { state: "failed" } | { state: "loaded"; clients: ClientSummary[] };

// One whole row is the link, so a click anywhere on it opens the client.
const rowLinkClass =
  "grid grid-cols-[1fr_1fr_3rem] items-center px-6 py-3.5 hover:bg-hover focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-accent";

function ClientsPage() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [search, setSearch] = useState("");
  const [reloads, setReloads] = useState(0); // goes up after a new sequence, so the list is read again

  useEffect(() => {
    let cancelled = false;
    loadClients().then(
      (clients) => !cancelled && setLoad({ state: "loaded", clients }),
      () => !cancelled && setLoad({ state: "failed" }),
    );
    return () => {
      cancelled = true;
    };
    // reloads isn't used inside: it's here so a new sequence re-reads the list.
  }, [reloads]);

  // Client IDs are four digits (ADR-054); capitals here only matter for any older ID.
  const query = search.trim().toUpperCase();
  const clients = load.state === "loaded" ? load.clients : [];
  const shown = clients.filter((client) => client.code.includes(query));

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      {/* The heading row: the title, the search (once there are clients) and New sequence. */}
      <div className="flex items-center gap-4">
        <h1 className="flex-1 text-4xl font-semibold">Clients</h1>
        {load.state === "loaded" && clients.length > 0 && (
          <div className="relative w-60">
            {/* Read by screen readers; the placeholder shows the same words on screen. */}
            <label htmlFor="client-search" className="sr-only">
              Search client ID
            </label>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 fill-none stroke-ink-muted stroke-2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              id="client-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search client ID"
              autoComplete="off"
              spellCheck={false}
              className={`${fieldClass} pl-12`}
            />
          </div>
        )}
        {/* New sequence and ⋯ sit closer together than the rest of the row. */}
        <div className="flex items-center gap-2">
          <GenerateSequence onCreated={() => setReloads((count) => count + 1)} />
          {/* Export CSV, with the same search (roadmap 10.1). Always shown, switched off until there are clients. */}
          <ClientsMenu
            matches={(code) => code.includes(query)}
            disabled={load.state !== "loaded" || clients.length === 0}
          />
        </div>
      </div>

      {load.state === "loading" && <p className="mt-8">Loading…</p>}

      {load.state === "failed" && (
        <p role="alert" className="mt-8">
          Couldn't load the clients. Check your internet connection and reload the page.
        </p>
      )}

      {load.state === "loaded" && clients.length === 0 && <p className="mt-8">No clients yet.</p>}

      {load.state === "loaded" && clients.length > 0 && (
        <>
          <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
            {/* Column titles for sighted users. Each row's link text says the same to a screen reader. */}
            <div aria-hidden="true" className="grid grid-cols-[1fr_1fr_3rem] border-b border-line px-6 py-3 text-base">
              <span className="font-semibold">Client ID</span>
              <span className="text-ink-muted">Last visit</span>
            </div>
            {shown.length === 0 && <p className="px-6 py-5">No client ID matches "{search.trim()}".</p>}
            {shown.length > 0 && (
              <ul>
                {shown.map((client) => {
                  return (
                    <li key={client.id} className="border-b border-line last:border-b-0">
                      <Link to={`/dashboard/clients/${client.id}`} className={rowLinkClass}>
                        <span className="font-semibold">{client.code}</span>
                        <span className="flex items-center gap-3 text-base">
                          <span className="sr-only">Last visit </span>
                          {client.lastVisitAt ? formatDate(client.lastVisitAt) : "—"}
                          {client.visitOpen && (
                            <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-success-ink">Open</span>
                          )}
                        </span>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="size-5 justify-self-end fill-none stroke-ink stroke-2"
                        >
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Announced to screen readers as the search narrows the list. */}
          <p aria-live="polite" className="mt-4 text-base text-ink-muted">
            Showing {shown.length} of {clients.length} {clients.length === 1 ? "client" : "clients"}. All clinicians at
            the practice see all clients.
          </p>
        </>
      )}
    </main>
  );
}

export default ClientsPage;
