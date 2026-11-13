// This test's identity. index.ts publishes it, every result stores it (ADR-001),
// and the dashboard lists it by name (roadmap 8.4b).

export const testId = "swaps";
export const testName = "SWAPS";
export const testVersion = "0.1.0";

// The sheets this test saves (SPEC: Recording), labeled and in the order the dashboard shows them (roadmap 8.7).
export const sheetLabels: Record<string, string> = { sheet: "Answer sheet" };
