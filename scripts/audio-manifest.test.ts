import { describe, expect, it } from "vitest";
import { clipHash, needsClip } from "./audio-manifest.ts";

const settings = {
  service: "elevenlabs",
  voiceId: "voice-1",
  modelId: "model-1",
  outputFormat: "mp3-1",
};
const text = "Begin.";

describe("clipHash", () => {
  it("gives the same fingerprint for the same input", () => {
    expect(clipHash(text, settings)).toBe(clipHash(text, { ...settings }));
  });

  it("changes when the text changes", () => {
    expect(clipHash("Begin!", settings)).not.toBe(clipHash(text, settings));
  });

  it("changes when the service changes", () => {
    const other = { ...settings, service: "other" };
    expect(clipHash(text, other)).not.toBe(clipHash(text, settings));
  });

  it("changes when the voice changes", () => {
    const other = { ...settings, voiceId: "voice-2" };
    expect(clipHash(text, other)).not.toBe(clipHash(text, settings));
  });

  it("changes when the model changes", () => {
    const other = { ...settings, modelId: "model-2" };
    expect(clipHash(text, other)).not.toBe(clipHash(text, settings));
  });

  it("changes when the format changes", () => {
    const other = { ...settings, outputFormat: "mp3-2" };
    expect(clipHash(text, other)).not.toBe(clipHash(text, settings));
  });
});

describe("needsClip", () => {
  it("skips a clip that matches and exists", () => {
    expect(needsClip("abc", "abc", true)).toBe(false);
  });

  it("makes a clip whose fingerprint changed", () => {
    expect(needsClip("new", "old", true)).toBe(true);
  });

  it("makes a clip that was never recorded", () => {
    expect(needsClip("abc", undefined, true)).toBe(true);
  });

  it("makes a clip whose file is missing", () => {
    expect(needsClip("abc", "abc", false)).toBe(true);
  });
});
