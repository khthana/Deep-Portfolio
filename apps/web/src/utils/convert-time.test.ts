import { describe, expect, it } from "vitest";
import { formatDateToTimeString } from "./convert-time";

/**
 * The "HH:MM" a timetable slot is drawn with.
 *
 * The dates here are built from local parts — `new Date(2024, 0, 5, 9, 5)` —
 * so they say nine-oh-five in whichever zone the suite happens to run in.
 * That is deliberate: the function reads the wall clock, and a case written
 * with an instant instead would only mean "09:05" on a machine at UTC.
 */

describe("formatDateToTimeString", () => {
  it("formats a time as two-digit hours and minutes", () => {
    expect(formatDateToTimeString(new Date(2024, 0, 5, 13, 45))).toBe("13:45");
  });

  it("pads a single-digit hour and minute", () => {
    expect(formatDateToTimeString(new Date(2024, 0, 5, 9, 5))).toBe("09:05");
  });

  it("writes midnight as 00:00, not 24:00", () => {
    expect(formatDateToTimeString(new Date(2024, 0, 5, 0, 0))).toBe("00:00");
  });

  it("drops the seconds", () => {
    expect(formatDateToTimeString(new Date(2024, 0, 5, 13, 45, 59))).toBe(
      "13:45",
    );
  });

  it("returns null when there is no time to show", () => {
    expect(formatDateToTimeString(null)).toBeNull();
    expect(formatDateToTimeString(undefined)).toBeNull();
  });

  it("reads the wall clock, not UTC", () => {
    // The same moment twice: once as local parts, once as the instant they
    // denote. A timetable slot is a wall-clock time, so both must render as
    // 09:05 — an implementation reading `getUTCHours` would agree here only on
    // a machine at UTC, and this case is written to fail everywhere else.
    const localNineOhFive = new Date(2024, 0, 5, 9, 5);

    expect(
      formatDateToTimeString(new Date(localNineOhFive.toISOString())),
    ).toBe("09:05");
  });
});
