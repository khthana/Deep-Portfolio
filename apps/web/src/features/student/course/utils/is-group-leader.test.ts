import { describe, expect, it } from "vitest";
import { isGroupLeader } from "./is-group-leader";

describe("isGroupLeader", () => {
  const group = [
    { student_id: "64010001", role: "LEADER" as const },
    { student_id: "64010002", role: "MEMBER" as const },
  ];

  it("says yes to the student whose row leads the group", () => {
    expect(isGroupLeader(group, "64010001")).toBe(true);
  });

  it("says no to a member who is not the leader", () => {
    // The whole point of #27: being in the group is not leading it.
    expect(isGroupLeader(group, "64010002")).toBe(false);
  });

  it("says no to a student who is not in the group at all", () => {
    expect(isGroupLeader(group, "64010003")).toBe(false);
  });

  it("says no while the group is still loading", () => {
    expect(isGroupLeader(undefined, "64010001")).toBe(false);
  });

  it("says no before the signed-in student is known", () => {
    // home.studentId starts as the empty string, and no member row can carry
    // it — but a blank id must never match, whatever the list holds.
    expect(isGroupLeader(group, "")).toBe(false);
    expect(isGroupLeader([{ student_id: "", role: "LEADER" }], "")).toBe(false);
  });
});
