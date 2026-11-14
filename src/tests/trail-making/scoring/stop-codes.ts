// Adds the NACC codes to a stopped test's scores (ADR-049, SPEC: Stopped by the clinician). Pure.
// The browser never knows the clinician's reason, so save-result adds these on the server, after the
// browser-versus-server check:
// - 996 on the timed part after a sample, for Unable to complete during that sample, its instructions,
//   the pause after it or the wait before the timed part.
// - 997 on Part B, for Alphabet check not passed.
// Only a part that wasn't given gets a code.

import type { PartScore, TrailMakingScores } from "./score-part.ts";
import type { StopPoint } from "./score-test.ts";

// Each sample and the timed part it leads to.
const partAfter = { sampleA: "partA", sampleB: "partB" } as const;

// The timed part whose sample the stop found the test at, or null.
function partAfterSampleAt(stop: StopPoint): "partA" | "partB" | null {
  if (stop.page === "sampleA" || stop.page === "sampleB") {
    // The wait before a sample comes before it starts, so it doesn't count.
    return stop.phase === "waiting" ? null : partAfter[stop.page];
  }
  // The wait before a timed part comes right after its sample.
  return stop.phase === "waiting" ? stop.page : null;
}

function withCode(part: PartScore, code: 996 | 997): PartScore {
  return part.status === "notGiven" ? { status: "notGiven", code } : part;
}

export function withStopCodes(
  scores: TrailMakingScores,
  stop: StopPoint | null,
  stopReason: string | null,
): TrailMakingScores {
  if (stop === null) return scores;

  if (stopReason === "alphabet_check_not_passed") {
    return { ...scores, partB: withCode(scores.partB, 997) };
  }

  if (stopReason === "unable_to_complete") {
    const part = partAfterSampleAt(stop);
    if (part !== null) return { ...scores, [part]: withCode(scores[part], 996) };
  }

  return scores;
}
