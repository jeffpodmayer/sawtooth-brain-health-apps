// A visit's real-time channel name (roadmap 9.3, ADR-051): "visit:" and a SHA-256 hash of the
// link token with a fixed prefix. Must match private.visit_channel in the add_visit_pings migration.
export async function visitChannelName(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(`sawtooth-visit:${token}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return "visit:" + Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
