// What the script's actions show at each moment. Pure: each action gives the next view.

import type { ActionLine, ScriptLine } from "../../shared/test-script";
import { gridItems } from "./form-a";
import type { Answers } from "./selection";

export type ScriptView = {
  arrowOn: string | null;
  highlighted: number | null;
  selected: number | null;
  answers: Answers;
  inputOn: boolean;
};

// In this test's script.json, these actions also name a target, and a fill names its number.
type ViewAction = ActionLine & { target: string; value: number };

export const startView: ScriptView = { arrowOn: null, highlighted: null, selected: null, answers: new Map(), inputOn: false };

function itemNumber(target: string): number {
  return Number(target.split(":")[1]);
}

function arrowTarget(view: ScriptView, target: string): string {
  return target === "key:correct" && view.selected !== null ? `key:${gridItems[view.selected - 1].symbol}` : target;
}

export function applyScriptAction(view: ScriptView, line: ActionLine): ScriptView {
  const { action, target, value } = line as ViewAction;

  if (action === "arrow") return { ...view, arrowOn: arrowTarget(view, target) };
  if (action === "highlight") return { ...view, highlighted: itemNumber(target) };
  if (action === "fill") return { ...view, answers: new Map(view.answers).set(itemNumber(target), value) };
  if (action === "select") return { ...view, selected: target === "current" ? view.selected : itemNumber(target) };
  if (action === "enableInput") return { ...view, arrowOn: null, highlighted: null, inputOn: true };

  if (action === "clear" && view.selected !== null) {
    const answers = new Map(view.answers);
    answers.delete(view.selected);

    return { ...view, answers };
  }

  return view;
}

// An arrow with no speech after it needs a moment on screen, so the lines after it wait.
// Gives the lines to read now and the lines to run after that moment.
export function splitAfterFinalArrow(lines: readonly ScriptLine[]): [ScriptLine[], ScriptLine[]] {
  const lastSpoken = lines.findLastIndex((line) => line.type === "spoken");
  const lastArrow = lines.findLastIndex((line) => line.type === "action" && line.action === "arrow");

  return lastArrow > lastSpoken ? [lines.slice(0, lastArrow + 1), lines.slice(lastArrow + 1)] : [[...lines], []];
}
