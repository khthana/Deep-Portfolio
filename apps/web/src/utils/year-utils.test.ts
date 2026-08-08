import { describe, expect, it } from "vitest";
import { convertToBE, convertToCE } from "./year-utils";

/**
 * One real test, to prove the frontend runner works end to end. Broader
 * coverage of src/utils lives in #19; this file exists so #8 leaves behind a
 * `npm test` that is green in both workspaces rather than only in the API.
 */

describe("convertToBE", () => {
  it("adds 543 to a Common Era year", () => {
    expect(convertToBE(2024)).toBe(2567);
  });

  it("accepts the string a form field actually produces", () => {
    expect(convertToBE("2024")).toBe(2567);
  });

  it("returns undefined for an empty or absent year", () => {
    expect(convertToBE("")).toBeUndefined();
    expect(convertToBE(null)).toBeUndefined();
    expect(convertToBE(undefined)).toBeUndefined();
  });

  it("returns undefined rather than NaN for unparseable input", () => {
    expect(convertToBE("not a year")).toBeUndefined();
  });
});

describe("convertToCE", () => {
  it("subtracts 543 from a Buddhist Era year", () => {
    expect(convertToCE(2567)).toBe(2024);
  });

  it("round-trips with convertToBE", () => {
    expect(convertToCE(convertToBE(2024))).toBe(2024);
  });
});
