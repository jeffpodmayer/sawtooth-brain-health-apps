// This test's identity. index.ts publishes it, every result stores it (ADR-001),
// and the dashboard lists it by name (roadmap 8.4b).

export const testId = "trail-making";
export const testName = "Trail Making";
export const testVersion = "0.1.0";

// The sheets this test saves (SPEC: Recording), labeled and in the order the dashboard shows them (roadmap 8.7).
export const sheetLabels: Record<string, string> = { partA: "Part A", partB: "Part B" };

// Stop reasons the dashboard offers for this test, on top of the shared ones (ADR-049). The database's
// stop-reason check must list each key.
export const stopReasons: Record<string, string> = { alphabet_check_not_passed: "Alphabet check not passed" };
