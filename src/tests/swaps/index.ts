// The SWAPS plug-in (ADR-001).

import type { TestModule } from "../../shared/test-module";
import Swaps from "./Swaps";
import { testId, testVersion } from "./test-info";

export const swaps: TestModule = {
  id: testId,
  name: "SWAPS",
  version: testVersion,
  Component: Swaps,
};
