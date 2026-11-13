// Clients list (roadmap 8.3). New clients are added in Generate Test Sequence (8.4).
// Reads go through RLS, so a clinician only ever sees their own practice.

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatDate } from "./formatDate";
import { supabase } from "./supabase";
import { useSequencesMade } from "./useSequencesMade";

const linkClass =
  "text-accent underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

type Client = { id: string; code: string; created_at: string };

type Load =
  | { state: "loading" }
  | { state: "failed" }
  | { state: "loaded"; clients: Client[] };

function ClientsPage() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const sequencesMade = useSequencesMade();

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("clients")
      .select("id, code, created_at")
      .order("code")
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoad(error ? { state: "failed" } : { state: "loaded", clients: data });
      });
    return () => {
      cancelled = true;
    };
    // sequencesMade isn't used inside: it's here so a new sequence re-reads the list.
  }, [sequencesMade]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-4xl font-bold">Clients</h1>

      {load.state === "loading" && <p className="mt-8">Loading…</p>}

      {load.state === "failed" && (
        <p role="alert" className="mt-8">
          Couldn't load the clients. Check your internet connection and reload the page.
        </p>
      )}

      {load.state === "loaded" && load.clients.length === 0 && <p className="mt-8">No clients yet.</p>}

      {load.state === "loaded" && load.clients.length > 0 && (
        <table className="mt-8 w-full text-left">
          <thead>
            <tr className="border-b-2 border-form-gray">
              <th scope="col" className="py-3 pr-8">Client code</th>
              <th scope="col" className="py-3">Added</th>
            </tr>
          </thead>
          <tbody>
            {load.clients.map((client) => (
              <tr key={client.id} className="border-b border-form-gray">
                <td className="py-3 pr-8 font-bold">
                  <Link to={`/dashboard/clients/${client.id}`} className={linkClass}>
                    {client.code}
                  </Link>
                </td>
                <td className="py-3">{formatDate(client.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

export default ClientsPage;
