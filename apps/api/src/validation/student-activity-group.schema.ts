import { z } from "zod";
import { id, userId } from "./fields";

/**
 * `/student-activity-group` — the group a piece of graded work is handed in by.
 *
 * The member list is the whole group each time, not a delta: the endpoint
 * deletes the rows it has and writes these back. An empty list is therefore a
 * group with nobody in it, which the API offers no way out of — refusing it
 * belongs to #27, along with the missing check that the caller is the leader,
 * because both need to know who is asking and this schema does not.
 *
 * `role` is checked against the same two words the column is an enum of, so a
 * misspelling is reported here rather than as a failed insert halfway through
 * the transaction that has already written the group.
 */

export const groupMember = z.object({
  student_id: userId,
  role: z.enum(["LEADER", "MEMBER"]),
});

export const createStudentActivityGroupBody = z.object({
  activity_id: id,
  members: z.array(groupMember),
});

export const updateStudentActivityGroupBody = z.object({
  group_id: id,
  members: z.array(groupMember),
});

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
