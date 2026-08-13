import { describe, expect, it } from "vitest";
import { formatSubmissionStatus } from "./format-submission-status";

describe("formatSubmissionStatus", () => {
  it("says work nobody handed in is not waiting to be marked", () => {
    // The row #56 put on the screen. Before it, anything that was not GRADED
    // meant a teacher had something to read.
    expect(formatSubmissionStatus("NOT_SUBMITTED")).toBe("NOT_SUBMITTED");
  });

  it("says marked work is marked", () => {
    expect(formatSubmissionStatus("GRADED")).toBe("GRADED");
  });

  it("reads work that is in but unmarked as waiting", () => {
    expect(formatSubmissionStatus("SUBMITTED")).toBe("PENDING");
  });

  it("reads a half-marked submission the same way", () => {
    // GRADING is a state of the marking, not of the work: something is in and
    // nobody has finished with it, which is what the teacher needs to know.
    expect(formatSubmissionStatus("GRADING")).toBe("PENDING");
  });
});
