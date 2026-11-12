// Every test the app can run (ADR-001). A new test adds its folder and one line here.

import type { TestModule } from "../shared/test-module";
import { swaps } from "./swaps";
import { trailMaking } from "./trail-making";

export const testModules: TestModule[] = [trailMaking, swaps];

// A sequence's tests, in the order given. Null if the app doesn't have one of them.
export function testsForIds(ids: string[]): TestModule[] | null {
  const tests = ids.map((id) => testModules.find((test) => test.id === id));
  return tests.every((test) => test !== undefined) ? tests : null;
}
