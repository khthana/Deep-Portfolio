import { z } from "zod";
import { id, userId } from "./fields";
import { groupMember } from "./student-activity-group.schema";

/**
 * `/student-learning-activity-group` — the same five endpoints as
 * `/student-activity-group`, over classroom work instead of graded work.
 *
 * The member list and its roles are literally the same shape, so `groupMember`
 * is shared; only the id naming the work differs.
 */

export const createStudentLearningActivityGroupBody = z.object({
  learning_activity_id: id,
  members: z.array(groupMember),
});

export const updateStudentLearningActivityGroupBody = z.object({
  group_id: id,
  members: z.array(groupMember),
});

export const studentLearningActivityGroupQuery = z.object({
  student_id: userId,
  learning_activity_id: id,
});

export const studentLearningActivityGroupInSecQuery = z.object({
  student_id: userId,
  section_id: id,
});

export const studentsWithoutLearningGroupQuery = z.object({
  section_id: id,
  learning_activity_id: id,
});

export type CreateStudentLearningActivityGroupBody = z.infer<
  typeof createStudentLearningActivityGroupBody
>;
export type UpdateStudentLearningActivityGroupBody = z.infer<
  typeof updateStudentLearningActivityGroupBody
>;
