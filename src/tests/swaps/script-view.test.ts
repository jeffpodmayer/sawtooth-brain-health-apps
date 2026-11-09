import { expect, it } from "vitest";
import { checkScript, type ActionLine } from "../../shared/test-script";
import script from "./script.json";
import { applyScriptAction, splitAfterFinalArrow, startView } from "./script-view";

const sections = checkScript(script).sections;

const arrowOnHeart = { id: "a", type: "action", action: "arrow", target: "key:heart" } as ActionLine;
const arrowOnItem2 = { id: "b", type: "action", action: "arrow", target: "item:2" } as ActionLine;
const highlight1 = { id: "c", type: "action", action: "highlight", target: "item:1" } as ActionLine;
const highlight2 = { id: "d", type: "action", action: "highlight", target: "item:2" } as ActionLine;
const fill1 = { id: "e", type: "action", action: "fill", target: "item:1", value: 7 } as ActionLine;
const select4 = { id: "f", type: "action", action: "select", target: "item:4" } as ActionLine;
const enableInput = { id: "g", type: "action", action: "enableInput" } as ActionLine;
const highlightRecall = { id: "h", type: "action", action: "highlight", target: "recall:all" } as ActionLine;
const selectSquare = { id: "i", type: "action", action: "select", target: "recall:square" } as ActionLine;
const selectCross = { id: "j", type: "action", action: "select", target: "recall:cross" } as ActionLine;

it("replaces the last arrow with a new one", () => {
  const view = applyScriptAction(applyScriptAction(startView, arrowOnHeart), arrowOnItem2);

  expect(view.arrowOn).toBe("item:2");
});

it("replaces the last highlight with a new one", () => {
  const view = applyScriptAction(applyScriptAction(startView, highlight1), highlight2);

  expect(view.highlighted).toBe(2);
});

it("fills in a number without changing the view it started from", () => {
  const view = applyScriptAction(startView, fill1);

  expect(view.answers.get(1)).toBe(7);
  expect(startView.answers.size).toBe(0);
});

it("ends the script's demo with its three numbers filled in", () => {
  const actions = sections.demo.filter((line): line is ActionLine => line.type === "action");
  const end = actions.reduce(applyScriptAction, startView);

  expect(end.answers).toEqual(new Map([[1, 7], [2, 1], [3, 6]]));
  expect(end.arrowOn).toBe("key:flag");
  expect(end.highlighted).toBe(3);
});

it("selects a box", () => {
  expect(applyScriptAction(startView, select4).selected).toBe(4);
});

it("clears the arrow and highlight when input turns on, and keeps the selection", () => {
  const before = [arrowOnHeart, highlight1, select4].reduce(applyScriptAction, startView);
  const view = applyScriptAction(before, enableInput);

  expect(view).toMatchObject({ arrowOn: null, highlighted: null, selected: 4, inputOn: true });
});

it("highlights all the recall symbols at once", () => {
  const view = applyScriptAction(startView, highlightRecall);

  expect(view.allHighlighted).toBe(true);
  expect(view.highlighted).toBeNull();
});

it("selects a recall symbol by its place on the recall form", () => {
  expect(applyScriptAction(startView, selectSquare).selected).toBe(1);
  expect(applyScriptAction(startView, selectCross).selected).toBe(7);
});

it("ends the script's recall section with the first symbol selected and the pad on", () => {
  const actions = sections.recall.filter((line): line is ActionLine => line.type === "action");
  const end = actions.reduce(applyScriptAction, startView);

  expect(end).toMatchObject({ selected: 1, allHighlighted: false, highlighted: null, inputOn: true });
});

it("makes the lines after practice's last arrow wait", () => {
  const [now, later] = splitAfterFinalArrow(sections.practice);

  expect(now.map((line) => line.id)).toEqual(["pr-01", "pr-02", "pr-03"]);
  expect(later.map((line) => line.id)).toEqual(["pr-04", "pr-05"]);
});

it("doesn't wait when speech follows the last arrow", () => {
  const [now, later] = splitAfterFinalArrow(sections.practiceFeedback);

  expect(now).toHaveLength(sections.practiceFeedback.length);
  expect(later).toEqual([]);
});

it("runs the script's practice feedback on the selected box", () => {
  const wrongAt5 = { ...startView, selected: 5, answers: new Map([[4, 2], [5, 1]]) };
  const actions = sections.practiceFeedback.filter((line): line is ActionLine => line.type === "action");
  const arrowOn = actions.slice(0, 2).reduce(applyScriptAction, wrongAt5).arrowOn;
  const end = actions.reduce(applyScriptAction, wrongAt5);

  expect(arrowOn).toBe("key:heart");
  expect(end).toMatchObject({ selected: 5, arrowOn: null, inputOn: true });
  expect(end.answers).toEqual(new Map([[4, 2]]));
});
