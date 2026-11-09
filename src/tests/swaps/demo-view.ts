// What the demo shows at each moment. Pure: each action in the script gives the next view.

import type { ActionLine } from "../../shared/test-script";
import type { Answers } from "./selection";

export type DemoView = {
  arrowOn: string | null;
  highlighted: number | null;
  answers: Answers;
};

// In this test's script.json, these actions also name a target, and a fill names its number.
type DemoAction = ActionLine & { target: string; value: number };

export const startDemoView: DemoView = { arrowOn: null, highlighted: null, answers: new Map() };

function itemNumber(target: string): number {
  return Number(target.split(":")[1]);
}

export function applyDemoAction(view: DemoView, line: ActionLine): DemoView {
  const { action, target, value } = line as DemoAction;

  if (action === "arrow") return { ...view, arrowOn: target };
  if (action === "highlight") return { ...view, highlighted: itemNumber(target) };
  if (action === "fill") return { ...view, answers: new Map(view.answers).set(itemNumber(target), value) };

  return view;
}
