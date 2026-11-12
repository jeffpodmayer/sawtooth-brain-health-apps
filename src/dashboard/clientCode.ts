// Client code rules for the dashboard's forms (used from roadmap 8.4).
// The same rule as the database's clients_code_format_check (2.3). The database has the final say.

export const CLIENT_CODE_FORMAT = /^[A-Z0-9-]{1,20}$/;

export const CLIENT_CODE_HINT = "Letters, numbers and hyphens, up to 20 characters. Never a name.";

// What's wrong with a typed code (already trimmed), or null if it fits the format.
export function clientCodeProblem(code: string): string | null {
  if (code === "") return "Type a client code.";
  if (!CLIENT_CODE_FORMAT.test(code)) {
    return "Use only capital letters, numbers and hyphens, up to 20 characters (for example, SBH-0042).";
  }
  return null;
}

// Turns what's typed into capitals, keeping the cursor where it was. Returns the new value.
export function upperCaseKeepingCursor(input: HTMLInputElement): string {
  const { selectionStart, selectionEnd } = input;
  input.value = input.value.toUpperCase();
  input.setSelectionRange(selectionStart, selectionEnd);
  return input.value;
}
