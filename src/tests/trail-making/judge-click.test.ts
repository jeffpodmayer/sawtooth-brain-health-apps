import { describe, expect, it } from "vitest";
import { judgeClick } from "./judge-click";
import { expectedOrder } from "./order";

const { partA, partB } = expectedOrder;

describe("judgeClick", () => {
  it("accepts circle 1 as the first click", () => {
    expect(judgeClick(partA, 0, "1")).toBe("correct");
  });

  it("accepts the next circle in order", () => {
    expect(judgeClick(partA, 3, "4")).toBe("correct");
  });

  it("accepts the End circle as the last click", () => {
    expect(judgeClick(partA, 24, "25")).toBe("correct");
  });

  it("follows the alternating order on Part B", () => {
    expect(judgeClick(partB, 3, "B")).toBe("correct");
    expect(judgeClick(partB, 3, "3")).toBe("error");
  });

  it("counts a wrong first click as an error", () => {
    expect(judgeClick(partA, 0, "2")).toBe("error");
  });

  it("counts a circle further ahead as an error", () => {
    expect(judgeClick(partA, 3, "9")).toBe("error");
  });

  it("counts a circle connected earlier as an error", () => {
    expect(judgeClick(partA, 3, "1")).toBe("error");
  });

  it("ignores the last correct circle clicked again", () => {
    expect(judgeClick(partA, 3, "3")).toBe("ignored");
  });

  it("ignores any click after the End circle is reached", () => {
    expect(judgeClick(partA, 25, "25")).toBe("ignored");
    expect(judgeClick(partA, 25, "1")).toBe("ignored");
  });
});
