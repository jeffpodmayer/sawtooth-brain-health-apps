import { expect, it } from "vitest";
import { clientCodeProblem, digitsOnly } from "./clientCode";

it("accepts four digits, including a leading zero", () => {
  expect(clientCodeProblem("1234")).toBeNull();
  expect(clientCodeProblem("0042")).toBeNull();
});

it("asks for a client ID when nothing is typed", () => {
  expect(clientCodeProblem("")).toBe("Type a client ID.");
});

it("refuses anything that isn't exactly four digits", () => {
  for (const code of ["123", "12345", "12a4", "SBH-0042", "TEST-001", "12 4"]) {
    expect(clientCodeProblem(code)).toBe("A client ID is four numbers, such as 0042.");
  }
});

it("keeps only the first four digits of what's typed or pasted", () => {
  expect(digitsOnly("12a3")).toBe("123");
  expect(digitsOnly(" 0042 ")).toBe("0042");
  expect(digitsOnly("123456")).toBe("1234");
  expect(digitsOnly("SBH-")).toBe("");
});
