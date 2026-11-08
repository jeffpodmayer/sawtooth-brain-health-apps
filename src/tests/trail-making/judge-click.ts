// Judges one click on a circle (SPEC: Errors). Pure: same inputs, same answer.
// Clicks outside every circle or during the voice never reach this function.

export type ClickOutcome = "correct" | "error" | "ignored";

export function judgeClick(
  order: readonly string[],
  correctSoFar: number,
  clicked: string,
): ClickOutcome {
  if (correctSoFar >= order.length) {
    return "ignored";
  }

  if (clicked === order[correctSoFar]) {
    return "correct";
  }

  if (clicked === order[correctSoFar - 1]) {
    return "ignored";
  }

  return "error";
}
