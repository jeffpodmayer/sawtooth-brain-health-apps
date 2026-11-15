// The tests a sequence can include, in the order they're given (roadmap 8.4b), with each test's score table
// and practice row for the client page, its sheet labels (ADR-047) and its CSV columns (10.1). Only
// test-info.ts and summary.ts are read, so the dashboard never downloads a test's screens. A new test is
// added here, and to enabled_tests' allowed ids by migration.

import {
  csvMeasures as swapsCsvMeasures,
  csvRows as swapsCsvRows,
  liveTable as swapsLiveTable,
  practiceRow as practiceSwaps,
  scoreTable as swapsTable,
} from "../cognitive-tests/swaps/summary";
import * as swaps from "../cognitive-tests/swaps/test-info";
import {
  csvMeasures as trailMakingCsvMeasures,
  csvRows as trailMakingCsvRows,
  liveTable as trailMakingLiveTable,
  practiceRow as practiceTrailMaking,
  scoreTable as trailMakingTable,
} from "../cognitive-tests/trail-making/summary";
import * as trailMaking from "../cognitive-tests/trail-making/test-info";

export const sequenceTests = [
  {
    id: trailMaking.testId,
    name: trailMaking.testName,
    table: trailMakingTable,
    liveTable: trailMakingLiveTable,
    practice: practiceTrailMaking,
    csvMeasures: trailMakingCsvMeasures,
    csvRows: trailMakingCsvRows,
    sheetLabels: trailMaking.sheetLabels,
    stopReasons: trailMaking.stopReasons,
    stopReasonHints: trailMaking.stopReasonHints,
    skips: trailMaking.skips,
    timedParts: trailMaking.timedParts,
    holds: trailMaking.holds,
  },
  {
    id: swaps.testId,
    name: swaps.testName,
    table: swapsTable,
    liveTable: swapsLiveTable,
    practice: practiceSwaps,
    csvMeasures: swapsCsvMeasures,
    csvRows: swapsCsvRows,
    sheetLabels: swaps.sheetLabels,
    stopReasons: swaps.stopReasons,
    stopReasonHints: swaps.stopReasonHints,
    skips: swaps.skips,
    timedParts: swaps.timedParts,
    holds: swaps.holds,
  },
];

// Each test by its id, for rows read from the database.
export const testsById = new Map(sequenceTests.map((test) => [test.id, test]));
