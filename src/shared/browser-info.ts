// Which browser ran the test, for rawData. Pure: same inputs, same answer.
// Keeps only the name and version, not the full identification string.

// Order matters: Edge also says "Chrome", and Chrome also says "Safari".
const browsers = [
  { name: "Edge", pattern: /Edg\/([\d.]+)/ },
  { name: "Firefox", pattern: /Firefox\/([\d.]+)/ },
  { name: "Chrome", pattern: /Chrome\/([\d.]+)/ },
  { name: "Safari", pattern: /Version\/([\d.]+).*Safari/ },
];

export function browserFrom(userAgent: string): { name: string; version: string } {
  for (const { name, pattern } of browsers) {
    const match = userAgent.match(pattern);

    if (match) {
      return { name, version: match[1] };
    }
  }

  return { name: "Unknown", version: "" };
}
