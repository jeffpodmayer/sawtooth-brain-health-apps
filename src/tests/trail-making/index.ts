// The Trail Making plug-in (ADR-001).

import type { TestModule } from "../../shared/test-module";
import TrailMaking from "./TrailMaking";

export const trailMaking: TestModule = {
  id: "trail-making",
  name: "Trail Making",
  version: "0.1.0",
  Component: TrailMaking,
};
