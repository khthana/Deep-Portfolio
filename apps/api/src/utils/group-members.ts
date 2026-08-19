import type {
  MemberStatus,
  StudentNameBrief,
  UnacceptedGroupMember,
} from "@deep-portfolio/api-types";

/**
 * Who is in a group, split the way a teacher's roster screen needs it.
 *
 * `ACCEPT` is what membership means everywhere something is granted
 * (ADR-0017), so the accepted rows are the ones the submission is read off and
 * the score lands on. The rest — invited and never answered, or declined — are
 * not part of the work, but the teacher still has to be told they exist: an
 * invitation expires after seven days and there is no resend endpoint, so a
 * student who never clicked simply is not on the list being marked (#53).
 *
 * The two submission tables are separate all the way down and their member rows
 * carry different submission relations, hence the generic: only `status` and
 * `student` are read here, and the accepted rows come back untouched so the
 * caller keeps whatever else it selected.
 */
export interface GroupMemberRow {
  status: MemberStatus;
  student: StudentNameBrief;
}

export function splitByAcceptance<T extends GroupMemberRow>(
  members: T[],
): { accepted: T[]; unaccepted: UnacceptedGroupMember[] } {
  const accepted: T[] = [];
  const unaccepted: UnacceptedGroupMember[] = [];

  for (const member of members) {
    const status: MemberStatus = member.status;

    if (status === "ACCEPT") {
      accepted.push(member);
    } else {
      unaccepted.push({ ...member.student, status });
    }
  }

  return { accepted, unaccepted };
}
