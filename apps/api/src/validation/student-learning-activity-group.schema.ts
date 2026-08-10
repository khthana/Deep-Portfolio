import { z } from "zod";
import { id } from "./fields";
import { memberList } from "./student-activity-group.schema";

/**
 * `/student-learning-activity-group` — the same six endpoints as
 * `/student-activity-group`, over classroom work instead of graded work.
 *
 * The member list, its roles and the rules it has to satisfy are literally the
 * same, so `memberList` is shared; only the id naming the work differs. The
 * path parameter `DELETE` takes is shared too, as `groupParams`.
 */

export const createStudentLearningActivityGroupBody = z.object({
  learning_activity_id: id,
  members: memberList,
});

export const updateStudentLearningActivityGroupBody = z.object({
  group_id: id,
  members: memberList,
});

export const studentLearningActivityGroupQuery = z.object({
  learning_activity_id: id,
});

export const studentLearningActivityGroupInSecQuery = z.object({
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
