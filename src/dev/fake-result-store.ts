// Development only (roadmap 5.1): keeps results in memory until the page reloads.

import type { ResultStore, ScreenSize } from "../shared/result-store";
import type { TestResult } from "../shared/test-module";

export type SavedResult = {
  result: TestResult;
  screen: ScreenSize;
};

export function createFakeResultStore(): ResultStore & { saved: SavedResult[] } {
  const saved: SavedResult[] = [];

  return {
    saved,
    saveResult: async (result, screen) => {
      saved.push({ result, screen });
    },
  };
}
