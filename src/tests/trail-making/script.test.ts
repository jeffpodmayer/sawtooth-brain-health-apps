import { expect, it } from "vitest";
import script from "./script.json";

it("script.json matches the approved copy", () => {
  expect(script).toMatchSnapshot();
});
