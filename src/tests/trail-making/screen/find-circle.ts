// Which circle is at this spot on the page? (SPEC: Screen and layout)
// Pure: same inputs, same answer.

import { circleOuterRadius, type PageLayout } from "./page-layouts";

export function findCircleAt(
  circles: PageLayout["circles"],
  x: number,
  y: number,
): string | null {
  const found = circles.find((circle) => Math.hypot(x - circle.x, y - circle.y) <= circleOuterRadius);

  return found?.id ?? null;
}
