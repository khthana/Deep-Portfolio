import { describe, expect, it } from "vitest";
import { formatUnacceptedMembers } from "./format-unaccepted-member";

describe("formatUnacceptedMembers", () => {
  it("writes the code, the name and what the silence is", () => {
    expect(
      formatUnacceptedMembers([
        {
          student_id: "65010002",
          first_name_th: "สมหญิง",
          last_name_th: "รักเรียน",
          status: "PENDING",
        },
      ]),
    ).toEqual(["65010002 สมหญิง รักเรียน (รอตอบรับ)"]);
  });

  it("tells a refusal apart from a silence", () => {
    expect(
      formatUnacceptedMembers([
        {
          student_id: "65010004",
          first_name_th: "สมปอง",
          last_name_th: "ขยัน",
          status: "REJECTED",
        },
      ]),
    ).toEqual(["65010004 สมปอง ขยัน (ปฏิเสธ)"]);
  });

  it("keeps the order the API sent", () => {
    expect(
      formatUnacceptedMembers([
        {
          student_id: "65010004",
          first_name_th: "สมปอง",
          last_name_th: "ขยัน",
          status: "REJECTED",
        },
        {
          student_id: "65010002",
          first_name_th: "สมหญิง",
          last_name_th: "รักเรียน",
          status: "PENDING",
        },
      ]),
    ).toEqual([
      "65010004 สมปอง ขยัน (ปฏิเสธ)",
      "65010002 สมหญิง รักเรียน (รอตอบรับ)",
    ]);
  });

  it("has nothing to say about a group that all accepted", () => {
    expect(formatUnacceptedMembers([])).toEqual([]);
  });

  it("has nothing to say about individual work either", () => {
    // The submission carries no group at all, so the page passes undefined
    // rather than reaching into a field that is not there.
    expect(formatUnacceptedMembers(undefined)).toEqual([]);
  });
});
