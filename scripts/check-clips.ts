// Stops the build if any clip is missing or out of date (roadmap 4.8), so
// clients can only ever hear approved audio. Runs first in `npm run build`.

import { existsSync } from "node:fs";
import { spokenText } from "../src/shared/test-script.ts";
import { clipHash, needsClip } from "./audio-manifest.ts";
import { loadScripts, readManifest } from "./audio-scripts.ts";
import { audioSettings } from "./audio-settings.ts";

const manifest = await readManifest();
const problems: string[] = [];

for (const { testName, lines } of await loadScripts()) {
  for (const line of lines) {
    const path = `public/audio/${testName}/${line.id}.mp3`;
    const hash = clipHash(spokenText(line), audioSettings);
    if (needsClip(hash, manifest[testName]?.[line.id], existsSync(path))) problems.push(path);
  }
}

if (problems.length > 0) {
  console.error(`Missing or out-of-date clips. Run npm run audio:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

console.log("All clips are present and up to date.");
