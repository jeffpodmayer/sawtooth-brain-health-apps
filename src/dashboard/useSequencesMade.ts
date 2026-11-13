// How many sequences Generate Test Sequence has made since the dashboard opened (roadmap 8.6).
// Pages that list clients or visits re-read their data when it changes.

import { useOutletContext } from "react-router";

export function useSequencesMade(): number {
  return useOutletContext<number>();
}
