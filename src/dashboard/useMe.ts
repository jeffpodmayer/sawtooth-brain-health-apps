// The signed-in clinician's name and practice, loaded once by the dashboard's top bar and passed to every page.
// null until loaded, or if it couldn't be loaded.

import { useOutletContext } from "react-router";

export type Me = { displayName: string; practiceName: string };

export function useMe(): Me | null {
  return useOutletContext<Me | null>();
}
