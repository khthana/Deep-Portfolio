import type { UnacceptedGroupMember } from "@deep-portfolio/api-types";

const WHAT_THE_SILENCE_IS: Record<UnacceptedGroupMember["status"], string> = {
  PENDING: "รอตอบรับ",
  REJECTED: "ปฏิเสธ",
};

/**
 * One line per person for the "ยังไม่ตอบรับ" column, in the order the API sent
 * them. Individual work has no group and group work may have nobody waiting, so
 * an absent list is as ordinary as an empty one and both come back empty.
 */
export function formatUnacceptedMembers(
  members: UnacceptedGroupMember[] | undefined,
): string[] {
  if (!members) return [];

  return members.map(
    (member) =>
      `${member.student_id} ${member.first_name_th} ${member.last_name_th} (${WHAT_THE_SILENCE_IS[member.status]})`,
  );
}
