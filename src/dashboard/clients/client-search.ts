// Finding clients by what's typed in Client ID (ADR-054). Pure: same inputs, same answer.

// One client, with their newest visit: when it was made, and whether its link still works.
export type ClientSummary = { id: string; code: string; lastVisitAt: string | null; visitOpen: boolean };

// Clients whose ID starts with what's typed, newest visit first, at most `limit`. Nothing typed, nothing shown.
export function matchingClients(clients: readonly ClientSummary[], typed: string, limit = 8): ClientSummary[] {
  if (typed === "") return [];
  return clients
    .filter((client) => client.code.startsWith(typed))
    .sort((a, b) => (b.lastVisitAt ?? "").localeCompare(a.lastVisitAt ?? ""))
    .slice(0, limit);
}
