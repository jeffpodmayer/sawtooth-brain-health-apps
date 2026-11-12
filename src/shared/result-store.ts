// Where finished tests are saved (ADR-001). Shared code saves through this,
// so swapping the fake store for the real one (roadmap 7.7) changes no tests.

import type { TestResult } from "./test-module";

// CSS pixels, in full screen (ADR-024).
export type ScreenSize = {
  width: number;
  height: number;
};

export type ResultStore = {
  // Resolves once the result is saved. Rejects if it couldn't be saved, so the caller can offer Try again.
  saveResult: (result: TestResult, screen: ScreenSize) => Promise<void>;
};
