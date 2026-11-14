// Clients list (roadmap 8.3, redesigned at 8.9): newest first, with a search by client ID.
// New clients are added in Generate Test Sequence (8.4). Reads go through RLS, so a clinician
// only ever sees their own practice.

import { useEffect, useState } from "react";
import { Link } from "react-router";
import ClientsMenu from "./ClientsMenu";
import GenerateSequence from "./GenerateSequence";
import { supabase } from "./supabase";

// sequences holds only the client's first visit. Whoever made it created the client, since a client
// is always created together with its first visit (ADR-044).
type Client = { id: string; code: string; sequences: { clinicians: { display_name: string } | null }[] };

type Load = { state: "loading" } | { state: "failed" } | { state: "loaded"; clients: Client[] };

const searchFieldClass =
  "block h-12 w-full rounded-lg border border-field-line bg-surface pl-12 pr-4 text-ink placeholder:text-ink-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent";
// One whole row is the link, so a click anywhere on it opens the client.
const rowLinkClass =
  "grid grid-cols-[1fr_1fr_3rem] items-center px-6 py-3.5 hover:bg-hover focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent";

function ClientsPage() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [search, setSearch] = useState("");
  const [reloads, setReloads] = useState(0); // goes up after a new sequence, so the list is read again

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("clients")
      .select("id, code, sequences(clinicians(display_name))")
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "sequences" })
      .limit(1, { referencedTable: "sequences" })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoad(error ? { state: "failed" } : { state: "loaded", clients: data });
      });
    return () => {
      cancelled = true;
    };
    // reloads isn't used inside: it's here so a new sequence re-reads the list.
  }, [reloads]);

  // Client IDs are capitals only (2.3), so typing in lowercase still matches.
  const query = search.trim().toUpperCase();
  const clients = load.state === "loaded" ? load.clients : [];
  const shown = clients.filter((client) => client.code.includes(query));

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      {/* The heading row: the title, the search (once there are clients) and New sequence. */}
      <div className="flex items-center gap-4">
        <h1 className="flex-1 text-4xl font-semibold">Clients</h1>
        {load.state === "loaded" && clients.length > 0 && (
          <div className="relative w-80">
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
              className={searchFieldClass}
            />
          </div>
        )}
        <GenerateSequence look="solid" onCreated={() => setReloads((count) => count + 1)} />
        {/* Export CSV, with the same search, once there are clients (roadmap 10.1). */}
        {load.state === "loaded" && clients.length > 0 && <ClientsMenu matches={(code) => code.includes(query)} />}
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
              <span className="text-ink-muted">Created by</span>
            </div>
            {shown.length === 0 && <p className="px-6 py-5">No client ID matches "{search.trim()}".</p>}
            {shown.length > 0 && (
              <ul>
                {shown.map((client) => (
                  <li key={client.id} className="border-b border-line last:border-b-0">
                    <Link to={`/dashboard/clients/${client.id}`} className={rowLinkClass}>
                      <span className="font-semibold">{client.code}</span>
                      <span className="text-base">
                        <span className="sr-only">Created by </span>
                        {client.sequences[0]?.clinicians?.display_name ?? "—"}
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
                ))}
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
