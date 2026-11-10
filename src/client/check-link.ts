// Asks the check-link Edge Function about a client link (roadmap 7.2).
// The browser never queries tables (ADR-002): it sends the link token and
// gets back the practice name and the tests still to run.

import { env } from "../shared/env";

export type LinkDetails = {
  sequenceId: string;
  practiceName: string;
  tests: string[];
};

// "notValid" is every refusal, whatever the reason (ADR-037).
// "failed" means we couldn't get an answer: no connection, or a fault on our side.
export type LinkCheck =
  | { status: "valid"; link: LinkDetails }
  | { status: "notValid" }
  | { status: "failed" };

export async function checkLink(token: string): Promise<LinkCheck> {
  try {
    // The token goes in the body, never in the address (ADR-037).
    const response = await fetch(`${env.supabaseUrl}/functions/v1/check-link`, {
      method: "POST",
      headers: {
        apikey: env.supabasePublishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
    if (response.status === 404) return { status: "notValid" };
    if (!response.ok) return { status: "failed" };

    const body = await response.json();
    return {
      status: "valid",
      link: {
        sequenceId: body.sequenceId,
        practiceName: body.practiceName,
        tests: body.tests,
      },
    };
  } catch {
    return { status: "failed" };
  }
}
