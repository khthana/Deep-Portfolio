import type { StudentNameBrief } from "./student";

/**
 * Group work — the students who are in one, and the students who are not.
 *
 * Two audiences read this table and they read it differently. A teacher's
 * roster asks who a mark lands on, and gets `SubmissionGroup`; a student's own
 * screen asks who is in their group and who has yet to answer, and gets
 * `GroupDetailResp`. Neither belongs to the activity feature or the
 * learning-activity one, which is why they are here (ADR-0029 §2).
 *
 * Everything here serves **both** halves of the system unchanged: the two group
 * tables are mirror images, and their endpoints answer the same shape field for
 * field (ADR-0035).
 */

/** `student_activity_group_member.status`. */
export type MemberStatus = "PENDING" | "ACCEPT" | "REJECTED";

/** `student_activity_group_member.role`. Exactly one member of a group is the
 *  leader — the one who created it — and the invitation flow treats them
 *  differently: a leader has nothing to accept, so their token columns stay
 *  null. */
export type GroupRole = "LEADER" | "MEMBER";

/**
 * One member of a group, as the student's own screen sees them.
 *
 * `student_name` is `student.full_name_th` already flattened out of the joined
 * row, and never null here: the service coalesces it to an empty string. Its
 * neighbour `StudentWithoutGroup` does not, which is the difference the two
 * declarations used to hide from each other.
 */
export type GroupMemberDetail = {
  student_id: string;
  role: GroupRole;
  student_name: string;
  status: MemberStatus;
};

/**
 * `GET /student-activity-group` and `/all`, and their learning-activity twins —
 * the group a student is in, or every member list they have worked in across a
 * section.
 *
 * The single read answers `null` when the student is in no group for that
 * activity, which is not the same as an empty group and is why the service's
 * return type says so.
 */
export type GroupDetailResp = {
  group_id: number;
  members: GroupMemberDetail[];
};

/**
 * `GET /student-activity-group/without-group` and its twin — a classmate the
 * work has not grouped yet, offered to whoever is building a group.
 *
 * `full_name_th` is the raw column here. It is generated from the two name
 * columns by default and is a string for every row the system writes, but the
 * column takes null and this endpoint hands it over untouched — unlike
 * `GroupMemberDetail.student_name`, which is coalesced. Written down rather
 * than assumed away (#68).
 */
export type StudentWithoutGroup = {
  student_id: string;
  full_name_th: string | null;
};

/**
 * What `POST` and `PATCH` on both group routes answer — the id of the group
 * that was written, and nothing else. The services return this literal rather
 * than the row.
 *
 * Nothing reads the id today: both modals check `success`, close, and let the
 * screen fetch the group again through `GroupDetailResp`. It is declared
 * because it is what goes over the wire, not because a caller needs it.
 *
 * `DELETE` answers `null` in `data` and so has no type here, for the same
 * reason `accept-invite` does not (ADR-0035).
 */
export type GroupIdResp = {
  group_id: number;
};

/**
 * `POST /group/validate-invite` — what the student behind an invitation link is
 * being asked to answer, before the page offers them the two buttons.
 *
 * One field, and it is the member's own status: accept-invite-page.tsx shows
 * the two buttons only under PENDING, and under ACCEPT or REJECTED shows the
 * answer that was already given instead. An expired or unknown token is not a
 * status here — it is a 400 with a Thai sentence, which is why nothing in this
 * type stands for "invalid".
 *
 * Its neighbour `POST /group/accept-invite` has no type here on purpose: it
 * answers `{ success, message }` with no `data` key at all, so what a caller
 * would import is the absence of a body. That is a question about the envelope,
 * and the envelope is #67.
 */
export type ValidateInviteResp = {
  status: MemberStatus;
};

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
