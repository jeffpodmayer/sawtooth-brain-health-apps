// What the script's actions show at each moment. Pure: each action gives the next view.

import type { ActionLine, ScriptLine } from "../../../shared/test-script";
import { gridItems, recallOrder } from "../scoring/form-a";
import type { Answers } from "./selection";

export type ScriptView = {
  arrowOn: string | null;
  highlighted: number | null;
  allHighlighted: boolean;
  selected: number | null;
  answers: Answers;
  inputOn: boolean;
};

// In this test's script.json, these actions also name a target, and a fill names its number.
type ViewAction = ActionLine & { target: string; value: number };

export const startView: ScriptView = { arrowOn: null, highlighted: null, allHighlighted: false, selected: null, answers: new Map(), inputOn: false };

// item:N is grid item N. recall:<symbol> is that symbol's place on the recall form, from 1.
function itemNumber(target: string): number {
  const [kind, name] = target.split(":");

  return kind === "recall" ? (recallOrder as readonly string[]).indexOf(name) + 1 : Number(name);
}

// key:correct is the right number in the key for the selected box; item:current is the selected box itself.
function arrowTarget(view: ScriptView, target: string): string {
  if (view.selected === null) return target;
  if (target === "key:correct") return `key:${gridItems[view.selected - 1].symbol}`;
  if (target === "item:current") return `item:${view.selected}`;

  return target;
}

export function applyScriptAction(view: ScriptView, line: ActionLine): ScriptView {
  const { action, target, value } = line as ViewAction;

  if (action === "arrow") return { ...view, arrowOn: arrowTarget(view, target) };
  // key:all and recall:all light up the whole key row or every recall symbol; one box ends that.
  if (action === "highlight") {
    return target.endsWith(":all") ? { ...view, allHighlighted: true } : { ...view, highlighted: itemNumber(target), allHighlighted: false };
  }
  if (action === "fill") return { ...view, answers: new Map(view.answers).set(itemNumber(target), value) };
  if (action === "select") return { ...view, selected: target === "current" ? view.selected : itemNumber(target) };
  if (action === "enableInput") return { ...view, arrowOn: null, highlighted: null, allHighlighted: false, inputOn: true };

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
