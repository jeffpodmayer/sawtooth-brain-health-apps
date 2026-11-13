// The tests a sequence can include, in the order they're given (roadmap 8.4b), with each
// test's score summary (8.6). Only test-info.ts and summary.ts are read, so the dashboard
// never downloads a test's screens. A new test is added here, and to enabled_tests' allowed ids by migration.

import { summarizeScores as summarizeSwaps } from "../tests/swaps/summary";
import * as swaps from "../tests/swaps/test-info";
import { summarizeScores as summarizeTrailMaking } from "../tests/trail-making/summary";
import * as trailMaking from "../tests/trail-making/test-info";

export const sequenceTests = [
  { id: trailMaking.testId, name: trailMaking.testName, summarize: summarizeTrailMaking },
  { id: swaps.testId, name: swaps.testName, summarize: summarizeSwaps },
];
