import { describe, expect, it } from "vitest";
import { cleanNullStr } from "./clean-null-str";

/**
 * Undoing the damage of a null that was stringified somewhere upstream.
 *
 * The portfolio forms are fed straight from the API response, and an input
 * bound to the literal text "null" shows the word to the student. This walks a
 * response and turns those two strings into an empty one. What it does *not*
 * do — leave a real null alone, and flatten anything that is an object but not
 * a plain one — is the part worth pinning.
 */

describe("cleanNullStr", () => {
  it("replaces the strings null and undefined with an empty string", () => {
    expect(cleanNullStr("null")).toBe("");
    expect(cleanNullStr("undefined")).toBe("");
  });

  it("leaves a real null, undefined or empty string as it found it", () => {
    // Only the *text* is the mistake. A field the API genuinely left empty
    // keeps its value, so a caller can still tell "not filled in" from "".
    expect(cleanNullStr(null)).toBeNull();
    expect(cleanNullStr(undefined)).toBeUndefined();
    expect(cleanNullStr("")).toBe("");
  });

  it("leaves other primitives alone", () => {
    expect(cleanNullStr("นายทดสอบ")).toBe("นายทดสอบ");
    expect(cleanNullStr(0)).toBe(0);
    expect(cleanNullStr(false)).toBe(false);
    expect(cleanNullStr("nullable")).toBe("nullable");
  });

  it("walks into every value of an object", () => {
    expect(
      cleanNullStr({
        first_name_th: "ทดสอบ",
        nickname: "null",
        gpax: "undefined",
      }),
    ).toEqual({ first_name_th: "ทดสอบ", nickname: "", gpax: "" });
  });

  it("walks into every element of an array", () => {
    expect(cleanNullStr(["null", "ปี 1", "undefined"])).toEqual([
      "",
      "ปี 1",
      "",
    ]);
  });

  it("walks all the way down a nested response", () => {
    expect(
      cleanNullStr({
        student: { name: "null", skills: [{ level: "undefined" }] },
      }),
    ).toEqual({ student: { name: "", skills: [{ level: "" }] } });
  });

  it("returns a new object rather than editing the response in place", () => {
    const response = { nickname: "null" };

    const cleaned = cleanNullStr(response);

    expect(cleaned).not.toBe(response);
    expect(response.nickname).toBe("null");
  });

  it("empties a Date, because a Date is an object with no own entries", () => {
    // Pinned, not endorsed. `typeof new Date() === "object"`, so a date is
    // rebuilt from `Object.entries` — which are none — and comes back as `{}`.
    // Nothing breaks today because the portfolio responses carry their dates as
    // ISO strings, but anything sent through here as a real Date is destroyed.
    expect(cleanNullStr(new Date("2024-01-05T00:00:00Z"))).toEqual({});
  });
});
