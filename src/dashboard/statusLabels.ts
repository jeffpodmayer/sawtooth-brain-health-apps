// Plain words for the database's status values, shared by the dashboard pages.
// An unknown value shows as it is, so a status added later never shows blank.

export const testStatusLabels: Record<string, string> = {
  pending: "Not taken yet",
  completed: "Completed",
  stopped: "Stopped",
  not_given: "Not given",
};

export const stopReasonLabels: Record<string, string> = {
  gave_up: "Gave up",
  interrupted: "Interrupted",
  unable_to_complete: "Unable to complete",
};
