// Client ID rules for the dashboard's forms (used from roadmap 8.4).
// A client ID is exactly four digits, such as 0042 (ADR-054). The same rule as the database's
// clients_code_format_check, which has the final say.

const CLIENT_CODE_FORMAT = /^[0-9]{4}$/;

// What's wrong with a typed ID (already trimmed), or null if it fits the format.
export function clientCodeProblem(code: string): string | null {
  if (code === "") return "Type a client ID.";
  if (!CLIENT_CODE_FORMAT.test(code)) return "A client ID is four numbers, such as 0042.";
  return null;
}

// What the Client ID field keeps of what's typed or pasted: its digits, at most four.
export function digitsOnly(typed: string): string {
  return typed.replace(/\D/g, "").slice(0, 4);
}
