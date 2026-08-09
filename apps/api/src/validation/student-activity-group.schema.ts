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
 * The reads take the student they are about from the query string, so all three
 * parameters are required.
 *
 * `student_id` on `/all` is the one that mattered most: it reached Prisma as
 * `some: { student_id: undefined }`, which is not a filter matching nothing but
 * no filter at all — so leaving it out widened the answer from "my groups" to
 * every group in the section, member lists included (#26).
 */
export const studentActivityGroupQuery = z.object({
  student_id: userId,
  activity_id: id,
});

export const studentActivityGroupInSecQuery = z.object({
  student_id: userId,
  section_id: id,
});

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
