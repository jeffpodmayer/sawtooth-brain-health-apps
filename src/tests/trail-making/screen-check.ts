// Is there room to draw a page with circles big enough to click? (SPEC: Screen and layout)
// Pure: same inputs, same answer.

import { circleRadius, pageSize } from "./page-layouts";

// Working answer, pending clinician approval.
const minCircleDiameterPx = 40;

export function pageScale(width: number, height: number): number {
  return Math.min(width / pageSize.width, height / pageSize.height);
}

export function isScreenLargeEnough(width: number, height: number): boolean {
  return 2 * circleRadius * pageScale(width, height) >= minCircleDiameterPx;
}
