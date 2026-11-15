// The Trail Making plug-in (ADR-001).

import type { TestModule } from "../../shared/test-module";
import { testId, testName, testVersion } from "./test-info";
import TrailMaking from "./TrailMaking";

export const trailMaking: TestModule = {
  id: testId,
  name: testName,
  version: testVersion,
  Component: TrailMaking,
};
