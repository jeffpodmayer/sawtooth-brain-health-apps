import { expect, it } from "vitest";
import { checkScript } from "../../shared/test-script";
import script from "./script.json";

it("script.json matches the approved copy", () => {
  expect(script).toMatchSnapshot();
});

it("script.json has the right shape", () => {
  expect(checkScript(script)).toBe(script);
});
