// Runs a section of a test's script.json in order (ADR-006). A clip ending triggers the next line.

import type { AudioPlayer } from "./audio-player";
import type { ActionLine, ScriptLine } from "./test-script";

// Spoken lines play. Action lines go to the test, which decides what each one does.
// If the test hands back a promise for an action, the next line waits for it.
// Finishes with true if every line ran, or false if a clip was stopped partway.
export async function runScript(
  lines: readonly ScriptLine[],
  player: Pick<AudioPlayer, "play">,
  onAction: (line: ActionLine) => unknown,
): Promise<boolean> {
  for (const line of lines) {
    if (line.type === "action") {
      await onAction(line);
    } else if (!(await player.play(line.id))) {
      return false;
    }
  }

  return true;
}
