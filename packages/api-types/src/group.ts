import type { StudentNameBrief } from "./student";

/**
 * Group work, as the teacher's two roster endpoints report it.
 *
 * Both halves of the marking screen — `GET /activity/submitted/list` and
 * `GET /learning-activity/submitted/list` — send the same shape, and the API
 * had one declaration the learning half imported from the activity half. It is
 * neither feature's, so it has a file of its own (ADR-0029 §2).
 *
 * The group feature proper — inviting, accepting, leaving — has endpoints of
 * its own under /student-activity-group and has not moved yet (#68). What is
 * here is the part a roster sends.
 */

/** `student_activity_group_member.status`. */
export type MemberStatus = "PENDING" | "ACCEPT" | "REJECTED";

/**
 * The group behind a group submission.
 *
 * The two lists are deliberately separate. `members` means "who this score
 * lands on", which since ADR-0017 is the ACCEPT members and nobody else;
 * `unaccepted_members` is everyone who was invited and has not accepted, which
 * is information the teacher has no other way to get — invitations expire after
 * seven days, so a student who never clicked would otherwise be silently
 * missing from the list being marked (ADR-0023, #53).
 */
export type SubmissionGroup = {
  group_id: number;
  members: StudentNameBrief[];
  unaccepted_members: UnacceptedGroupMember[];
};

/** ACCEPT is what `members` is; what is left is the two kinds of silence, and
 *  the caller is told which one it is looking at. */
export type UnacceptedGroupMember = StudentNameBrief & {
  status: Exclude<MemberStatus, "ACCEPT">;
};
