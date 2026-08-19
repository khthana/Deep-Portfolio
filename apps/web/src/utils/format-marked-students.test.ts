import { describe, expect, it } from "vitest";
import { formatMarkedStudents } from "./format-marked-students";

describe("formatMarkedStudents", () => {
  it("names the one student of individual work", () => {
    expect(
      formatMarkedStudents({
        submission_type: "INDIVIDUAL",
        student: {
          student_id: "65010001",
          first_name_th: "สมชาย",
          last_name_th: "ใจดี",
        },
      }),
    ).toEqual({ codes: ["65010001"], names: ["สมชาย ใจดี"] });
  });

  it("names every member of a group, code and name in the same order", () => {
    expect(
      formatMarkedStudents({
        submission_type: "GROUP",
        group: {
          members: [
            {
              student_id: "65010001",
              first_name_th: "สมชาย",
              last_name_th: "ใจดี",
            },
            {
              student_id: "65010003",
              first_name_th: "สมศรี",
              last_name_th: "มีสุข",
            },
          ],
        },
      }),
    ).toEqual({
      codes: ["65010001", "65010003"],
      names: ["สมชาย ใจดี", "สมศรี มีสุข"],
    });
  });

  // Three cases used to sit here: group work carrying a stray `student`
  // alongside its group and checking that the group still won, group work
  // arriving without its group, and individual work without its student. All
  // three described rows the type could express and the API has never sent,
  // and #68 made the type say so — a submission is a union on
  // `submission_type` now, so none of the three can be built to pass in.
  //
  // Something real went with them: the old body answered `{codes: [], names:
  // []}` for such a row, and the new one reads `submission.group.members`
  // straight, so a malformed row would throw instead. That is the trade the
  // union makes — the guard moves from runtime to the compiler, and a response
  // that lies about its own `submission_type` is a broken API, not a row this
  // formatter should quietly paper over. What the endpoints really answer is
  // pinned at the HTTP seam in apps/api/test.

  it("counts a group with nobody in it as nobody", () => {
    expect(
      formatMarkedStudents({
        submission_type: "GROUP",
        group: { members: [] },
      }),
    ).toEqual({ codes: [], names: [] });
  });
});
