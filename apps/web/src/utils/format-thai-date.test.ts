import { describe, expect, it } from "vitest";
import {
  checkIsOverSubmittionDeadline,
  checkIsToday,
  checkIsTomorrow,
  convertDateToThaiFormat,
  formatThaiDate,
  getShortDate,
  isSameDay,
} from "./format-thai-date";

/**
 * Showing a date to a Thai reader: Buddhist-era years and abbreviated Thai
 * month names.
 *
 * Two habits keep these cases honest about time zones. Dates are built from
 * local parts (`new Date(2024, 0, 5)`) or from a string with no offset, both of
 * which mean the same wall-clock day everywhere; and the three "is it near
 * now?" predicates are asked about a `now` the case derives from the real
 * clock, so nothing here depends on the suite being run at a particular
 * moment either.
 */

describe("formatThaiDate", () => {
  it("writes the day, the short Thai month and the Buddhist-era year", () => {
    expect(formatThaiDate("2024-01-05T13:45:00")).toBe("5 ม.ค. 2567");
  });

  it("does not pad the day", () => {
    expect(formatThaiDate("2024-12-31T00:00:00")).toBe("31 ธ.ค. 2567");
  });

  it("adds 543 across the new year", () => {
    expect(formatThaiDate("2025-01-01T00:00:00")).toBe("1 ม.ค. 2568");
  });

  it("reads a date-only string as an instant, not as a wall-clock day", () => {
    // A bare date is parsed as midnight *UTC* and then rendered in local time,
    // so west of Greenwich this call says 4 ม.ค. Naming the instant instead of
    // the day is what makes the case true in every zone — and why every other
    // case here passes a string with a time in it, which does mean the same
    // day everywhere.
    expect(formatThaiDate("2024-01-05")).toBe(
      formatThaiDate(new Date(Date.UTC(2024, 0, 5)).toISOString()),
    );
  });
});

describe("getShortDate", () => {
  it("names the day of the week in one or two Thai letters", () => {
    // 5 January 2024 was a Friday.
    expect(getShortDate("2024-01-05T13:45:00")).toBe("ศ");
  });

  it("uses the two-letter form where Thai needs one", () => {
    // Thursday — "พฤ", to keep it apart from Wednesday's "พ".
    expect(getShortDate("2024-01-04T13:45:00")).toBe("พฤ");
  });

  it("counts Sunday as the first day of the week", () => {
    expect(getShortDate("2024-01-07T13:45:00")).toBe("อา");
  });
});

describe("convertDateToThaiFormat", () => {
  it("writes a padded Buddhist-era date and a 24-hour time", () => {
    expect(convertDateToThaiFormat(new Date(2024, 0, 5, 13, 45))).toBe(
      "05 ม.ค. 2567, 13:45",
    );
  });

  it("keeps the hour in 24-hour form after midday", () => {
    expect(convertDateToThaiFormat(new Date(2024, 11, 31, 23, 59))).toBe(
      "31 ธ.ค. 2567, 23:59",
    );
  });

  it("returns undefined rather than a string when there is no date", () => {
    // The callers render this straight into JSX, where undefined draws
    // nothing — so the missing return is the empty cell.
    expect(convertDateToThaiFormat(null)).toBeUndefined();
  });

  it("reads the ISO string the API sends as the same instant as a Date", () => {
    // Every caller here is rendering a date that arrived over JSON, which
    // makes it a string however the type used to be written — see #68. Naming
    // the instant rather than the printed text keeps the case true in every
    // zone, which is what the suite's own rule asks for.
    const instant = new Date(Date.UTC(2024, 0, 5, 13, 45));

    expect(convertDateToThaiFormat(instant.toISOString())).toBe(
      convertDateToThaiFormat(instant),
    );
  });
});

describe("isSameDay", () => {
  it("is true for two times on the same calendar day", () => {
    expect(
      isSameDay(new Date(2024, 0, 5, 0, 0), new Date(2024, 0, 5, 23, 59)),
    ).toBe(true);
  });

  it("is false a minute either side of midnight", () => {
    expect(
      isSameDay(new Date(2024, 0, 5, 23, 59), new Date(2024, 0, 6, 0, 0)),
    ).toBe(false);
  });

  it("compares the calendar day, not the day number", () => {
    // Same date, different month and year: all three parts have to agree.
    expect(isSameDay(new Date(2024, 0, 5), new Date(2024, 1, 5))).toBe(false);
    expect(isSameDay(new Date(2024, 0, 5), new Date(2025, 0, 5))).toBe(false);
  });
});

describe("checkIsToday", () => {
  it("is true for a time earlier today", () => {
    const now = new Date();
    const earlierToday = new Date(now);
    earlierToday.setHours(0, 0, 1, 0);

    expect(checkIsToday(earlierToday)).toBe(true);
  });

  it("is false for the same date a year ago", () => {
    const now = new Date();
    const lastYear = new Date(now);
    lastYear.setFullYear(now.getFullYear() - 1);

    expect(checkIsToday(lastYear)).toBe(false);
  });

  it("is false when there is no date", () => {
    expect(checkIsToday(null)).toBe(false);
  });
});

describe("checkIsTomorrow", () => {
  it("is true for the day after today", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(checkIsTomorrow(tomorrow)).toBe(true);
  });

  it("is false for today and for the day after tomorrow", () => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    expect(checkIsTomorrow(new Date())).toBe(false);
    expect(checkIsTomorrow(dayAfter)).toBe(false);
  });

  it("is false when there is no date", () => {
    expect(checkIsTomorrow(null)).toBe(false);
  });
});

describe("checkIsOverSubmittionDeadline", () => {
  it("is true for a deadline that has passed", () => {
    expect(checkIsOverSubmittionDeadline(new Date(Date.now() - 1_000))).toBe(
      true,
    );
  });

  it("is false for a deadline still to come", () => {
    expect(checkIsOverSubmittionDeadline(new Date(Date.now() + 60_000))).toBe(
      false,
    );
  });

  it("is false when the work has no deadline at all", () => {
    // An activity with no deadline is never late. Same reading as the API,
    // which leaves `deadline_date` nullable.
    expect(checkIsOverSubmittionDeadline(null)).toBe(false);
  });
});
