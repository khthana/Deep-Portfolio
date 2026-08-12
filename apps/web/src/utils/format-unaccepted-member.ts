/**
 * The people invited into a group who are not in it: `PENDING` if the
 * invitation is still unanswered, `REJECTED` if it was turned down.
 *
 * Both submitted-list endpoints send them in `group.unaccepted_members`, kept
 * apart from `group.members` — which means "who this score lands on" since
 * ADR-0017 — so that a name the teacher is not marking can never be read as one
 * they are (ADR-0023). The two silences ask for different things: an unanswered
 * invitation expires after seven days and may want chasing, a refusal is an
 * answer already.
 */
export type UnacceptedMember = {
  student_id: string;
  first_name_th: string;
  last_name_th: string;
  status: "PENDING" | "REJECTED";
};

const WHAT_THE_SILENCE_IS: Record<UnacceptedMember["status"], string> = {
  PENDING: "รอตอบรับ",
  REJECTED: "ปฏิเสธ",
};

/**
 * One line per person for the "ยังไม่ตอบรับ" column, in the order the API sent
 * them. Individual work has no group and group work may have nobody waiting, so
 * an absent list is as ordinary as an empty one and both come back empty.
 */
export function formatUnacceptedMembers(
  members: UnacceptedMember[] | undefined,
): string[] {
  if (!members) return [];

  return members.map(
    (member) =>
      `${member.student_id} ${member.first_name_th} ${member.last_name_th} (${WHAT_THE_SILENCE_IS[member.status]})`,
  );
}
