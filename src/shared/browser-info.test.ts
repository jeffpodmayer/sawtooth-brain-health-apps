import { expect, it } from "vitest";
import { browserFrom } from "./browser-info";

const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const chromeSafari = "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

it("recognizes each supported browser", () => {
  expect(browserFrom(`${mac} ${chromeSafari}`)).toEqual({ name: "Chrome", version: "142.0.0.0" });
  expect(browserFrom(`${mac} ${chromeSafari} Edg/142.0.3595.53`)).toEqual({ name: "Edge", version: "142.0.3595.53" });
  expect(browserFrom(`${mac} Gecko/20100101 Firefox/145.0`)).toEqual({ name: "Firefox", version: "145.0" });
  expect(browserFrom(`${mac} AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15`)).toEqual({
    name: "Safari",
    version: "26.1",
  });
});

it("says so when it doesn't recognize a browser", () => {
  expect(browserFrom("Something else")).toEqual({ name: "Unknown", version: "" });
});
