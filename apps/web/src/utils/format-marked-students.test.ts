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

  it("reads the group of group work even when a student is attached too", () => {
    // The submission the API sends for group work carries the group; a stray
    // student must not turn one group's mark into one person's.
    expect(
      formatMarkedStudents({
        submission_type: "GROUP",
        student: {
          student_id: "65010001",
          first_name_th: "สมชาย",
          last_name_th: "ใจดี",
        },
        group: {
          members: [
            {
              student_id: "65010003",
              first_name_th: "สมศรี",
              last_name_th: "มีสุข",
            },
          ],
        },
      }),
    ).toEqual({ codes: ["65010003"], names: ["สมศรี มีสุข"] });
  });

  it("names nobody when group work arrives without its group", () => {
    expect(formatMarkedStudents({ submission_type: "GROUP" })).toEqual({
      codes: [],
      names: [],
    });
  });

  it("names nobody when individual work arrives without its student", () => {
    expect(formatMarkedStudents({ submission_type: "INDIVIDUAL" })).toEqual({
      codes: [],
      names: [],
    });
  });

  it("counts a group with nobody in it as nobody", () => {
    expect(
      formatMarkedStudents({
        submission_type: "GROUP",
        group: { members: [] },
      }),
    ).toEqual({ codes: [], names: [] });
  });
});
