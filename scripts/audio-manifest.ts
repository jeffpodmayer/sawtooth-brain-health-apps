// Decides which clips need making (roadmap 4.4). The manifest records the
// fingerprint each clip was made from.

import { createHash } from "node:crypto";

// Test name, then line id, then fingerprint.
export type AudioManifest = Record<string, Record<string, string>>;

export type ClipSettings = {
  service: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
};

export function clipHash(text: string, settings: ClipSettings): string {
  const { service, voiceId, modelId, outputFormat } = settings;
  const input = JSON.stringify([service, voiceId, modelId, outputFormat, text]);
  return createHash("sha256").update(input).digest("hex");
}

export function needsClip(
  hash: string,
  savedHash: string | undefined,
  fileExists: boolean,
): boolean {
  return hash !== savedHash || !fileExists;
}
