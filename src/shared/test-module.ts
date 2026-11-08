// The plug-in contract (ADR-001): what every test exports and what it hands back.
// Shared code uses only these types, so it never knows how a test is scored.

import type { ComponentType } from "react";

export type TestResult = {
  testId: string;
  testVersion: string;
  sequenceId: string;

  // Calendar times as ISO 8601 text in UTC, e.g. "2026-11-08T18:30:00.000Z".
  // They say when the test happened. Anything measured uses performance.now().
  startedAt: string;
  completedAt: string;

  // Each test decides what goes inside these. Stored as jsonb.
  // Write a test's own shapes with `type`: an `interface` won't fit here.
  scores: Record<string, unknown>;
  rawData: Record<string, unknown>;
};

export type TestProps = {
  sequenceId: string;

  // Turns true when a clinician stops the test. The test then stops its voice
  // and clicks, and calls onComplete with its partial result.
  stopRequested: boolean;

  // Called once, whether the test finished, timed out or was stopped.
  onComplete: (result: TestResult) => void;
};

export type TestModule = {
  id: string;
  name: string;
  version: string;
  Component: ComponentType<TestProps>;
};
