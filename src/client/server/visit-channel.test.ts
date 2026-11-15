import { describe, expect, it } from "vitest";
import { visitChannelName } from "./visit-channel";

describe("visitChannelName", () => {
  // The database's private.visit_channel gives this for the same fake token (checked on development at 9.3).
  it("matches the database's channel name", async () => {
    expect(await visitChannelName("ab".repeat(32))).toBe(
      "visit:d4404852e5a7f890f78d97f6f5e8bb12bb7278d0f7e5b86dd6673cbbcbf48fbf",
    );
  });
});
