// Practice's answer check (SPEC: Practice feedback). Not scored. Pure: same inputs, same answer.

import { gridItems } from "./form-a";

export function isRightNumber(item: number, number: number): boolean {
  return gridItems[item - 1].correctNumber === number;
}
