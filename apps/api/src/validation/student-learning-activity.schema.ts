import { z } from "zod";
import { classworkType } from "./activity.schema";
import { blankableText, bool, id } from "./fields";

/**
 * `/student-learning-activity` — marking one piece of classroom work.
 *
 * The field is called `activity_type` on both of these bodies even though
 * everything else here says `learning_activity`: it is what the frontend sends,
 * and it is what picks between the individual and the group path.
 *
 * Nothing is scored, so grading is the feedback and the status — no rubric, no
 * full score, no total level.
 */

export const gradeStudentLearningActivityBody = z.object({
  activity_type: classworkType,
  student_learning_activity_id: id,

  feedback: blankableText.optional(),
  remark: blankableText.optional(),
});

export const bookmarkStudentLearningActivityBody = z.object({
  activity_type: classworkType,
  student_learning_activity_id: id,
  is_bookmark: bool,
});

export type GradeStudentLearningActivityBody = z.infer<
  typeof gradeStudentLearningActivityBody
>;
export type BookmarkStudentLearningActivityBody = z.infer<
  typeof bookmarkStudentLearningActivityBody
>;
