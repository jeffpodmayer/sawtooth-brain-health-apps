// Is there room to draw a page with circles big enough to click? (SPEC: Screen and layout)
// Pure: same inputs, same answer.

import { circleRadius, pageSize } from "./page-layouts";

// Working answer, pending clinician approval.
const minCircleDiameterPx = 40;

export function isScreenLargeEnough(width: number, height: number): boolean {
  const scale = Math.min(width / pageSize.width, height / pageSize.height);

  return 2 * circleRadius * scale >= minCircleDiameterPx;
}
