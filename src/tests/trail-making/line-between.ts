// Where the line between two circles starts and ends: at each circle's outer edge,
// so the numbers and letters stay readable. Pure: same inputs, same answer.

import { circleOuterRadius, type Point } from "./page-layouts";

export function lineBetween(from: Point, to: Point) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const stepX = ((to.x - from.x) / distance) * circleOuterRadius;
  const stepY = ((to.y - from.y) / distance) * circleOuterRadius;

  return { x1: from.x + stepX, y1: from.y + stepY, x2: to.x - stepX, y2: to.y - stepY };
}
