// Saves a finished test through the save-result Edge Function (roadmap 7.7).
// The browser never writes to tables (ADR-002): it sends the link token, the result
// and the screen size, and the server checks and re-scores it (ADR-040).

import { env } from "../shared/env";
import type { ResultStore } from "../shared/result-store";

// The same limit as clip downloads (ADR-039). After this, the client is offered Try again.
const SAVE_TIME_LIMIT_MS = 30_000;

export function createResultStore(token: string): ResultStore {
  return {
    saveResult: async (result, screen) => {
      // The token goes in the body, never in the address (ADR-037).
      const response = await fetch(`${env.supabaseUrl}/functions/v1/save-result`, {
        method: "POST",
        headers: {
          apikey: env.supabasePublishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, result, screen }),
        signal: AbortSignal.timeout(SAVE_TIME_LIMIT_MS),
      });

      // 409: this test was saved already, e.g. the reply to an earlier try was lost.
      // The first saved result is kept (ADR-008), so this counts as saved.
      if (response.ok || response.status === 409) return;

      throw new Error(`save-result answered ${response.status}`);
    },
  };
}
