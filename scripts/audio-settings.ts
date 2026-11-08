// Single settings for the audio build (ADR-006). Not secret, so they live in
// git. The API key is separate, in .env.local.

export const audioSettings = {
  service: "elevenlabs",
  voiceId: "ByWUwXA3MMLREYmxtB32",
} as const;
