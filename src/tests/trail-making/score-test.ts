// Turns the whole test's click logs into its scores (SPEC: Scoring). Pure, like scorePart.
// For now this covers a test that ran to the end. A clinician's stop is added at 5.11.

import { scorePart, type LoggedClick, type TimedPart, type TrailMakingScores } from "./score-part";

export type ClickLogs = Record<TimedPart, readonly LoggedClick[]>;

export function scoreTest(clicks: ClickLogs): TrailMakingScores {
  return {
    partA: scorePart("partA", clicks.partA, null),
    partB: scorePart("partB", clicks.partB, null),
    sampleA: { passed: true },
    sampleB: { passed: true },
  };
}
