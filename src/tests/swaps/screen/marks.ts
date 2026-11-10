// The arrow that points at a key number or a grid item. Pure: same inputs, same answer.

import { keyNumbers, keyPrintedOrder, type SwapsSymbol } from "../scoring/form-a";
import { itemPosition, keyPosition, keySymbolSize, selectionSize, type Point } from "./form-layout";

const arrowGap = 6;
const arrowLength = 40;
const arrowHeadLength = 18;
const arrowHeadHalfWidth = 12;

// direction runs from the arrow's tip back toward its tail.
function arrowFrom(tip: Point, direction: Point) {
  function pointAt(steps: number): Point {
    return { x: tip.x + direction.x * steps, y: tip.y + direction.y * steps };
  }

  const headBase = pointAt(arrowHeadLength);
  const tail = pointAt(arrowLength);
  const spreadX = direction.y * arrowHeadHalfWidth;
  const spreadY = direction.x * arrowHeadHalfWidth;

  return {
    shaft: { x1: headBase.x, y1: headBase.y, x2: tail.x, y2: tail.y },
    head: `${tip.x},${tip.y} ${headBase.x - spreadX},${headBase.y + spreadY} ${headBase.x + spreadX},${headBase.y - spreadY}`,
  };
}

export function arrowToKey(symbol: SwapsSymbol) {
  const { x, y } = keyPosition(keyPrintedOrder.indexOf(symbol));

  return arrowFrom({ x, y: y - keySymbolSize / 2 - arrowGap }, { x: 0, y: -1 });
}

// Item arrows stop outside the selection square, so they don't run into a highlighted box.
// Item 1's comes from the left, because the "Demo" label is above it.
export function arrowToItem(item: number) {
  const { x, y } = itemPosition(item);
  const clearance = selectionSize / 2 + arrowGap;

  return item === 1 ? arrowFrom({ x: x - clearance, y }, { x: -1, y: 0 }) : arrowFrom({ x, y: y - clearance }, { x: 0, y: -1 });
}

// Reads a target as the script writes it, such as "item:2" or "key:heart".
export function arrowTo(target: string) {
  const [kind, name] = target.split(":");

  if (kind === "item") return arrowToItem(Number(name));
  if (kind === "key" && name in keyNumbers) return arrowToKey(name as SwapsSymbol);

  throw new Error(`No arrow target ${target}`);
}
