// True for a well-formed id, so a mistyped address shows "not found" without asking the database.
const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(text: string): boolean {
  return UUID_FORMAT.test(text);
}
