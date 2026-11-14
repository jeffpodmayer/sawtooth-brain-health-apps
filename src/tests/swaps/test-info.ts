// This test's identity. index.ts publishes it, every result stores it (ADR-001),
// and the dashboard lists it by name (roadmap 8.4b).

export const testId = "swaps";
export const testName = "SWAPS";
export const testVersion = "0.1.0";

// The sheets this test saves (SPEC: Recording), labeled and in the order the dashboard shows them (roadmap 8.7).
export const sheetLabels: Record<string, string> = { sheet: "Answer sheet" };

// Stop reasons the dashboard offers for this test, on top of the shared ones (ADR-049). None for now.
export const stopReasons: Record<string, string> = {};

// The timed parts this test reports while running (ADR-048), labeled as in its score table, so the dashboard
// shows the counter in that part's row.
export const timedParts: Record<string, string> = { test: "Test", recall: "Recall" };

// The steps this test holds before, in order, waiting for the clinician's Continue (ADR-050). The dashboard's
// button shows the next one, e.g. "▶ Test". The hold before Recall awaits the clinicians.
export const holds: string[] = ["Introduction", "Test", "Recall"];
