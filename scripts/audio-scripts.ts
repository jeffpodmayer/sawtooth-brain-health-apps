// Finds every script that has clips. Shared by the audio build and the
// pre-build clip check.

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { checkScript } from "../src/shared/test-script.ts";
import type { AudioManifest } from "./audio-manifest.ts";

export const manifestPath = "scripts/audio-manifest.json";

export async function readManifest(): Promise<AudioManifest> {
  if (!existsSync(manifestPath)) return {};
  return JSON.parse(await readFile(manifestPath, "utf8"));
}

export async function loadScripts() {
  // The client's sound check isn't a test, but it has a script and a clip too.
  const scriptFolders = ["src/client/sound-check"];
  for (const folder of await readdir("src/tests", { withFileTypes: true })) {
    if (folder.isDirectory()) scriptFolders.push(`src/tests/${folder.name}`);
  }

  const tests = [];
  for (const folder of scriptFolders) {
    const scriptPath = `${folder}/script.json`;
    if (!existsSync(scriptPath)) continue;
    const script = checkScript(JSON.parse(await readFile(scriptPath, "utf8")));
    const lines = Object.values(script.sections)
      .flat()
      .filter((line) => line.type === "spoken");
    tests.push({ testName: basename(folder), lines });
  }
  return tests;
}
