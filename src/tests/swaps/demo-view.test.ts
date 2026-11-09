import { expect, it } from "vitest";
import { checkScript, type ActionLine } from "../../shared/test-script";
import { applyDemoAction, startDemoView } from "./demo-view";
import script from "./script.json";

const arrowOnHeart = { id: "a", type: "action", action: "arrow", target: "key:heart" } as ActionLine;
const arrowOnItem2 = { id: "b", type: "action", action: "arrow", target: "item:2" } as ActionLine;
const highlight1 = { id: "c", type: "action", action: "highlight", target: "item:1" } as ActionLine;
const highlight2 = { id: "d", type: "action", action: "highlight", target: "item:2" } as ActionLine;
const fill1 = { id: "e", type: "action", action: "fill", target: "item:1", value: 7 } as ActionLine;

it("replaces the last arrow with a new one", () => {
  const view = applyDemoAction(applyDemoAction(startDemoView, arrowOnHeart), arrowOnItem2);

  expect(view.arrowOn).toBe("item:2");
});

it("replaces the last highlight with a new one", () => {
  const view = applyDemoAction(applyDemoAction(startDemoView, highlight1), highlight2);

  expect(view.highlighted).toBe(2);
});

it("fills in a number without changing the view it started from", () => {
  const view = applyDemoAction(startDemoView, fill1);

  expect(view.answers.get(1)).toBe(7);
  expect(startDemoView.answers.size).toBe(0);
});

it("ends the script's demo with its three numbers filled in", () => {
  const actions = checkScript(script).sections.demo.filter((line): line is ActionLine => line.type === "action");
  const end = actions.reduce(applyDemoAction, startDemoView);

  expect(end.answers).toEqual(new Map([[1, 7], [2, 1], [3, 6]]));
  expect(end.arrowOn).toBe("key:flag");
  expect(end.highlighted).toBe(3);
});
