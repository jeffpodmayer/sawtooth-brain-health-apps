// Development only (roadmap 5.1, 9.5): keeps results in memory until the page reloads, and stands in
// for the dashboard's Continue, End test and End whole sequence, so a sequence can run without a server.

import type { ResultStore, ScreenSize, TestStatus } from "../shared/result-store";
import type { TestResult } from "../shared/test-module";

export type SavedResult = {
  result: TestResult;
  screen: ScreenSize;
};

type FakeTest = { reached: number; released: number; stopRequested: boolean };

export function createFakeResultStore() {
  const saved: SavedResult[] = [];
  const notBegun: string[] = [];
  const tests = new Map<string, FakeTest>();
  const watchers = new Set<{ testId: string; onStatus: (status: TestStatus) => void }>();
  let sequenceOpen = true;
  let running: string | null = null;

  function testFor(testId: string): FakeTest {
    let test = tests.get(testId);
    if (!test) {
      test = { reached: 0, released: 0, stopRequested: false };
      tests.set(testId, test);
    }
    return test;
  }

  // Answers every watcher, a moment later, like a real check would.
  function answerWatchers() {
    queueMicrotask(() => {
      for (const { testId, onStatus } of watchers) {
        const { released, stopRequested } = testFor(testId);
        onStatus({ stopRequested, holdsReleased: released, sequenceOpen });
      }
    });
  }

  const store: ResultStore = {
    saveResult: async (result, screen) => {
      saved.push({ result, screen });
      return { sequenceOpen };
    },

    saveNotBegun: async (testId) => {
      notBegun.push(testId);
      return { sequenceOpen };
    },

    reportProgress: (testId, report) => {
      console.info("progress", testId, report);
      if (report.event === "holdReached") {
        const test = testFor(testId);
        test.reached = Math.max(test.reached, report.hold);
      }
    },

    watchTest: (testId, onStatus) => {
      const watcher = { testId, onStatus };
      running = testId;
      watchers.add(watcher);
      answerWatchers();
      return () => watchers.delete(watcher);
    },
  };

  return {
    ...store,
    saved,
    notBegun,

    // Continue: releases every hold the running test has reached, like the dashboard's button.
    continueTest() {
      if (running === null) return;
      const test = testFor(running);
      test.released = test.reached;
      answerWatchers();
    },

    // End current test.
    stopTest() {
      if (running === null) return;
      testFor(running).stopRequested = true;
      answerWatchers();
    },

    // End whole sequence: the visit closes and the running test is stopped.
    endSequence() {
      sequenceOpen = false;
      this.stopTest();
    },
  };
}
