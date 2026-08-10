import type { MemberDetail } from "../types/course-type";

/**
 * Whether this student leads this group.
 *
 * Since #27 the API lets only the leader send a new member list, so the screen
 * shows the editor to the leader alone — everyone else would be filling in a
 * form that comes back 403. The rule the API applies is ADR-0004's: one row
 * with `role = "LEADER"` whose student is the one asking.
 *
 * Takes the members as they arrive, which is `undefined` while the group is
 * still loading and for a student who has no group yet. Neither is a leader.
 */
export function isGroupLeader(
  members: Pick<MemberDetail, "student_id" | "role">[] | undefined,
  studentId: string | undefined,
): boolean {
  if (!studentId) return false;

  return (members ?? []).some(
    (member) => member.student_id === studentId && member.role === "LEADER",
  );
}
