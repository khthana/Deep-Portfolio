import { describe, expect, it } from "vitest";
import { formatScore } from "./format-score";

describe("formatScore", () => {
  it("writes a mark as it stands", () => {
    expect(formatScore(18)).toBe("18");
  });

  it("keeps the decimals a mean arrives with", () => {
    expect(formatScore(1.67)).toBe("1.67");
  });

  it("writes a zero mark as zero, not as a dash", () => {
    // The point of #28: a class that scored 0 is not a class nobody has marked.
    expect(formatScore(0)).toBe("0");
  });

  it("writes a dash when there is no number", () => {
    expect(formatScore(null)).toBe("-");
    expect(formatScore(undefined)).toBe("-");
  });
});
