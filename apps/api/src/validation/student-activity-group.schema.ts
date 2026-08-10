import { z } from "zod";
import { id, userId } from "./fields";

/**
 * `/student-activity-group` — the group a piece of graded work is handed in by.
 *
 * The member list is the whole group each time, not a delta: the endpoint
 * deletes the rows it has and writes these back. That makes the list a
 * description of the group as it will be, and `memberList` says what a group is
 * allowed to look like.
 *
 * `role` is checked against the same two words the column is an enum of, so a
 * misspelling is reported here rather than as a failed insert halfway through
 * the transaction that has already written the group.
 */

export const groupMember = z.object({
  student_id: userId,
  role: z.enum(["LEADER", "MEMBER"]),
});

/**
 * A group has people in it, and exactly one of them leads it (#27, ADR-0004).
 *
 * Both rules used to be missing, and both produced a group the API could not
 * get back out of. An empty list emptied the group and left the row behind with
 * no member to reach it through — disbanding is `DELETE`'s job now. A list with
 * no LEADER wrote a group that, under the leader check on these routes, nobody
 * would then be allowed to edit; two leaders is refused with it, because a group
 * whose membership two people can rewrite over each other is the same problem
 * from the other end.
 *
 * The leader rule is a `.refine` and so writes its own message: "exactly one"
 * is not something a caller could read off the type. It passes an empty list
 * rather than failing it, because zod runs every check on a value and an empty
 * list would otherwise be reported twice — as too short and as leaderless — for
 * one mistake.
 */
export const memberList = z
  .array(groupMember)
  .min(1)
  .refine(
    (members) =>
      members.length === 0 ||
      members.filter((member) => member.role === "LEADER").length === 1,
    { error: "ต้องมีหัวหน้ากลุ่มหนึ่งคน" },
  );

export const createStudentActivityGroupBody = z.object({
  activity_id: id,
  members: memberList,
});

export const updateStudentActivityGroupBody = z.object({
  group_id: id,
  members: memberList,
});

/**
 * `DELETE /:group_id` — the only one of these that names the group in the path
 * rather than in a body, because it sends nothing else.
 */
export const groupParams = z.object({ group_id: id });

/**
 * These two reads are about the student who is signed in, so `student_id` is not
 * a parameter of either — it comes from the session (#26, ADR-0003). What is
 * left is the thing being asked about, and it is required.
 *
 * The parameter used to be here, and on `/all` it reached Prisma as
 * `some: { student_id: undefined }`, which is not a filter matching nothing but
 * no filter at all — so leaving it out widened the answer from "my groups" to
 * every group in the section, member lists included. A field that is gone from
 * the schema cannot be left out.
 */
export const studentActivityGroupQuery = z.object({
  activity_id: id,
});

export const studentActivityGroupInSecQuery = z.object({
  section_id: id,
});

/**
 * The third read is the odd one out: it names a section and no student, so the
 * session does not narrow it and there is nothing here to take away. Who may ask
 * is settled by `requireEnrolledSection` on the route instead.
 */
export const studentsWithoutGroupQuery = z.object({
  section_id: id,
  activity_id: id,
});

export type CreateStudentActivityGroupBody = z.infer<
  typeof createStudentActivityGroupBody
>;
export type UpdateStudentActivityGroupBody = z.infer<
  typeof updateStudentActivityGroupBody
>;
export type MemberDetail = z.infer<typeof groupMember>;
