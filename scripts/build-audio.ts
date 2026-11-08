// Turns a spoken line from a test's script.json into an MP3 clip (ADR-006).
// Run with `npm run audio`. For now it makes one clip; roadmap 4.4 does the rest.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { checkScript } from "../src/shared/test-script.ts";
import { audioSettings } from "./audio-settings.ts";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is missing from .env.local");

const testName = "trail-making";

const script = checkScript(
  JSON.parse(await readFile(`src/tests/${testName}/script.json`, "utf8")),
);

const line = Object.values(script.sections)
  .flat()
  .find((candidate) => candidate.type === "spoken");
if (!line) throw new Error(`${testName}: no spoken lines`);

const { voiceId, modelId, outputFormat } = audioSettings;
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
  {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: line.text, model_id: modelId }),
  },
);

if (!response.ok) {
  throw new Error(`${line.id}: ElevenLabs said ${response.status}: ${await response.text()}`);
}

const folder = `public/audio/${testName}`;
await mkdir(folder, { recursive: true });
await writeFile(`${folder}/${line.id}.mp3`, Buffer.from(await response.arrayBuffer()));

console.log(`Saved ${folder}/${line.id}.mp3: "${line.text}"`);
