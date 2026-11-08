// Turns the spoken lines in every test's script.json into MP3 clips (ADR-006).
// Run with `npm run audio`. Only new or changed lines are sent to ElevenLabs.

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spokenText } from "../src/shared/test-script.ts";
import { clipHash, needsClip } from "./audio-manifest.ts";
import { loadScripts, manifestPath, readManifest } from "./audio-scripts.ts";
import { audioSettings } from "./audio-settings.ts";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is missing from .env.local");

async function generateClip(key: string, id: string, text: string): Promise<Buffer> {
  const { voiceId, modelId, outputFormat } = audioSettings;
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: modelId }),
    },
  );

  if (!response.ok) {
    throw new Error(`${id}: ElevenLabs said ${response.status}: ${await response.text()}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

// Check every script first, so a bad file stops the build before any credits are used.
const tests = await loadScripts();

const manifest = await readManifest();
let made = 0;
let skipped = 0;

for (const { testName, lines } of tests) {
  const folder = `public/audio/${testName}`;
  await mkdir(folder, { recursive: true });
  const saved = (manifest[testName] ??= {});

  for (const line of lines) {
    const path = `${folder}/${line.id}.mp3`;
    const spoken = spokenText(line);
    const hash = clipHash(spoken, audioSettings);
    if (!needsClip(hash, saved[line.id], existsSync(path))) {
      skipped++;
      continue;
    }

    await writeFile(path, await generateClip(apiKey, line.id, spoken));
    // Saved after each clip, so a failed run can pick up where it stopped.
    saved[line.id] = hash;
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    made++;
    console.log(`Made ${path}: "${spoken}"`);
  }
}

console.log(`Done: ${made} made, ${skipped} skipped.`);

// Hints need a person's ear, and a re-check on the final voice (ADR-029).
console.log("Lines with a pronunciation hint (listen to these):");
for (const { testName, lines } of tests) {
  for (const line of lines) {
    if (line.say) console.log(`  ${testName}/${line.id}: shows "${line.text}", says "${line.say}"`);
  }
}
