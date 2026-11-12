// The tests a sequence can include, in the order they're given (roadmap 8.4b).
// Only each test's test-info.ts is read, so the dashboard never downloads a test's screens.
// A new test is added here, and to enabled_tests' allowed ids by migration.

import * as swaps from "../tests/swaps/test-info";
import * as trailMaking from "../tests/trail-making/test-info";

export const sequenceTests = [trailMaking, swaps].map((test) => ({ id: test.testId, name: test.testName }));
