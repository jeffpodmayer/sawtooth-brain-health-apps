// The practice's clients, each with their newest visit. Reads go through RLS, so a clinician only ever sees
// their own practice. Used by the Clients list and the New Test Sequence form, so their dates always agree.

import type { ClientSummary } from "./client-search";
import { supabase } from "./supabase";

export async function loadClients(): Promise<ClientSummary[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, code, sequences(created_at, status)")
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "sequences", ascending: false })
    .limit(1, { referencedTable: "sequences" });
  if (error) throw error;
  return data.map((client) => ({
    id: client.id,
    code: client.code,
    lastVisitAt: client.sequences[0]?.created_at ?? null,
    visitOpen: client.sequences[0]?.status === "open",
  }));
}
