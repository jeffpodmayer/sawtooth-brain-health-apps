import { describe, expect, it } from "vitest";
import { checkScript } from "./test-script";

const spoken = { id: "a-01", type: "spoken", text: "Hello." };
const action = { id: "a-02", type: "action", action: "arrow" };

function scriptWith(...lines: unknown[]) {
  return { testId: "sample", sections: { one: lines } };
}

describe("checkScript", () => {
  it("accepts spoken and action lines and returns the script", () => {
    const script = scriptWith(spoken, action);
    expect(checkScript(script)).toBe(script);
  });

  it("accepts a pronunciation hint", () => {
    const script = scriptWith({ ...spoken, say: "Heh-low." });
    expect(checkScript(script)).toBe(script);
  });

  it("keeps extra fields on an action line", () => {
    const line = { ...action, target: "1" };
    expect(checkScript(scriptWith(line)).sections.one[0]).toEqual(line);
  });

  it("rejects something that isn't a script", () => {
    expect(() => checkScript(null)).toThrow("testId");
  });

  it("rejects a script with no testId", () => {
    expect(() => checkScript({ sections: { one: [spoken] } })).toThrow("testId");
  });

  it("rejects a script with no sections", () => {
    expect(() => checkScript({ testId: "sample" })).toThrow("sections");
  });

  it("rejects a section that isn't a list", () => {
    const script = { testId: "sample", sections: { one: "nope" } };
    expect(() => checkScript(script)).toThrow('section "one"');
  });

  it("rejects a line with a missing id, and says where it is", () => {
    const script = scriptWith(spoken, { type: "spoken", text: "Hi." });
    expect(() => checkScript(script)).toThrow(
      'sample, section "one", line 2: missing id',
    );
  });

  it("rejects an unknown type", () => {
    const script = scriptWith({ ...spoken, type: "sung" });
    expect(() => checkScript(script)).toThrow("unknown type");
  });

  it("rejects a spoken line with no text", () => {
    const script = scriptWith({ id: "a-01", type: "spoken" });
    expect(() => checkScript(script)).toThrow("text");
  });

  it("rejects a spoken line with blank text", () => {
    const script = scriptWith({ ...spoken, text: "   " });
    expect(() => checkScript(script)).toThrow("text");
  });

  it("rejects a pronunciation hint that isn't text", () => {
    const script = scriptWith({ ...spoken, say: 5 });
    expect(() => checkScript(script)).toThrow("say");
  });

  it("rejects an action line with no action name", () => {
    const script = scriptWith({ id: "a-02", type: "action" });
    expect(() => checkScript(script)).toThrow("action");
  });

  it("rejects the same id used twice, even across sections", () => {
    const script = {
      testId: "sample",
      sections: { one: [spoken], two: [spoken] },
    };
    expect(() => checkScript(script)).toThrow("duplicate id a-01");
  });
});
