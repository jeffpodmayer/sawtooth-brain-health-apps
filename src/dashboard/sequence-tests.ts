// The tests a sequence can include, in the order they're given (roadmap 8.4b), with each test's score table
// and practice row for the client page, and its sheet labels (ADR-047). Only test-info.ts and summary.ts
// are read, so the dashboard never downloads a test's screens. A new test is added here, and to
// enabled_tests' allowed ids by migration.

import { practiceRow as practiceSwaps, scoreTable as swapsTable } from "../tests/swaps/summary";
import * as swaps from "../tests/swaps/test-info";
import { practiceRow as practiceTrailMaking, scoreTable as trailMakingTable } from "../tests/trail-making/summary";
import * as trailMaking from "../tests/trail-making/test-info";

export const sequenceTests = [
  {
    id: trailMaking.testId,
    name: trailMaking.testName,
    table: trailMakingTable,
    practice: practiceTrailMaking,
    sheetLabels: trailMaking.sheetLabels,
    stopReasons: trailMaking.stopReasons,
    timedParts: trailMaking.timedParts,
    holds: trailMaking.holds,
  },
  {
    id: swaps.testId,
    name: swaps.testName,
    table: swapsTable,
    practice: practiceSwaps,
    sheetLabels: swaps.sheetLabels,
    stopReasons: swaps.stopReasons,
    timedParts: swaps.timedParts,
    holds: swaps.holds,
  },
];

// Each test by its id, for rows read from the database.
export const testsById = new Map(sequenceTests.map((test) => [test.id, test]));
