// Single settings for the audio build (ADR-006). Not secret, so they live in
// git. The API key is separate, in .env.local.

export const audioSettings = {
  service: "elevenlabs",
  voiceId: "hpp4J3VqNfWAUOO0d1Us",
  modelId: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
} as const;
