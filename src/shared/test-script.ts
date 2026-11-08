// The shape of a test's script.json (ADR-006), and a check for it.
// TypeScript can't see inside a JSON file while the code runs, so checkScript does.

export type SpokenLine = {
  id: string;
  type: "spoken";
  text: string;
  // Pronunciation hint: changes the audio only, never the displayed text.
  say?: string;
};

// Each test has its own actions and extra fields (target, seconds, ...).
export type ActionLine = {
  id: string;
  type: "action";
  action: string;
};

export type ScriptLine = SpokenLine | ActionLine;

export type TestScript = {
  testId: string;
  sections: Record<string, ScriptLine[]>;
};

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Throws if the line is malformed. Returns its id.
function checkLine(line: unknown, where: string): string {
  if (!isObject(line)) throw new Error(`${where}: not an object`);
  if (!isText(line.id)) throw new Error(`${where}: missing id`);

  if (line.type === "spoken") {
    if (!isText(line.text)) throw new Error(`${where}: missing text`);
    if ("say" in line && !isText(line.say)) {
      throw new Error(`${where}: say must be text`);
    }
  } else if (line.type === "action") {
    if (!isText(line.action)) throw new Error(`${where}: missing action name`);
  } else {
    throw new Error(`${where}: unknown type`);
  }

  return line.id;
}

// Returns the script if it's well formed. Throws at the first problem.
export function checkScript(data: unknown): TestScript {
  if (!isObject(data) || !isText(data.testId)) {
    throw new Error("Script has no testId");
  }
  if (!isObject(data.sections)) {
    throw new Error(`${data.testId}: no sections`);
  }

  // Each id becomes a clip's file name, so a repeat would overwrite a clip.
  const seenIds = new Set<string>();

  for (const [name, lines] of Object.entries(data.sections)) {
    if (!Array.isArray(lines)) {
      throw new Error(`${data.testId}, section "${name}": not a list`);
    }
    for (const [index, line] of lines.entries()) {
      const where = `${data.testId}, section "${name}", line ${index + 1}`;
      const id = checkLine(line, where);
      if (seenIds.has(id)) throw new Error(`${where}: duplicate id ${id}`);
      seenIds.add(id);
    }
  }

  return data as TestScript;
}

// What the voice says for a line. Screens always show line.text.
export function spokenText(line: SpokenLine): string {
  return line.say ?? line.text;
}
