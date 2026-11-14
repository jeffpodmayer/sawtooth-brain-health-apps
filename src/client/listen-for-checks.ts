// The client's tab listens for "check now" pings on its visit's channel (roadmap 9.3, ADR-051).
// Only the real-time connection, never the Supabase client: the tab still learns nothing
// except what the Edge Functions tell it (ADR-037, ADR-043).

import { RealtimeClient, type RealtimeChannel } from "@supabase/realtime-js";
import { env } from "../shared/env";
import { visitChannelName } from "./visit-channel";

// Calls onCheck on each ping, and each time the connection is (re)made, since pings sent while
// disconnected are lost. The ping carries nothing: onCheck should ask check-status.
// Returns a function that stops listening.
export function listenForChecks(token: string, onCheck: () => void): () => void {
  const realtime = new RealtimeClient(`${env.supabaseUrl.replace(/^http/, "ws")}/realtime/v1`, {
    params: { apikey: env.supabasePublishableKey },
  });
  let stopped = false;
  let channel: RealtimeChannel | undefined;

  visitChannelName(token).then((name) => {
    if (stopped) return;
    channel = realtime
      .channel(name)
      .on("broadcast", { event: "check" }, () => onCheck())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") onCheck();
      });
  });

  return () => {
    stopped = true;
    if (channel) realtime.removeChannel(channel);
    realtime.disconnect();
  };
}
