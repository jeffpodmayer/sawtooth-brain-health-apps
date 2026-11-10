// The shapes of the error marks: the slash across a wrong line and the arrow pointing at a circle.
// Pure: same inputs, same answer.

import type { lineBetween } from "./line-between";
import { circleOuterRadius, pageSize, type Point } from "./page-layouts";

type Line = ReturnType<typeof lineBetween>;

const slashAngle = Math.PI / 3;
const slashHalfLength = 20;

const arrowGap = 6;
const arrowLength = 70;
const arrowHeadLength = 24;
const arrowHeadHalfWidth = 16;

export function slashAcross({ x1, y1, x2, y2 }: Line): Line {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const alongX = (x2 - x1) / length;
  const alongY = (y2 - y1) / length;
  const stepX = (Math.cos(slashAngle) * alongX - Math.sin(slashAngle) * alongY) * slashHalfLength;
  const stepY = (Math.cos(slashAngle) * alongY + Math.sin(slashAngle) * alongX) * slashHalfLength;
  const middleX = (x1 + x2) / 2;
  const middleY = (y1 + y2) / 2;

  return { x1: middleX - stepX, y1: middleY - stepY, x2: middleX + stepX, y2: middleY + stepY };
}

// The arrow sits on the side of the circle facing the middle of the page,
// because circles near an edge have no room on the outer side.
export function arrowTo(circle: Point) {
  const toMiddleX = pageSize.width / 2 - circle.x;
  const toMiddleY = pageSize.height / 2 - circle.y;
  const distance = Math.hypot(toMiddleX, toMiddleY);
  const directionX = toMiddleX / distance;
  const directionY = toMiddleY / distance;

  function pointAt(steps: number): Point {
    return { x: circle.x + directionX * steps, y: circle.y + directionY * steps };
  }

  const tip = pointAt(circleOuterRadius + arrowGap);
  const headBase = pointAt(circleOuterRadius + arrowGap + arrowHeadLength);
  const tail = pointAt(circleOuterRadius + arrowGap + arrowLength);
  const spreadX = directionY * arrowHeadHalfWidth;
  const spreadY = directionX * arrowHeadHalfWidth;

  return {
    shaft: { x1: headBase.x, y1: headBase.y, x2: tail.x, y2: tail.y },
    head: `${tip.x},${tip.y} ${headBase.x - spreadX},${headBase.y + spreadY} ${headBase.x + spreadX},${headBase.y - spreadY}`,
  };
}
