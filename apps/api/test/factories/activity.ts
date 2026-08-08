import type { Prisma } from "@prisma/client";
import prisma from "../../src/config/prisma";
import { createCourse } from "./course";
import { createStudent } from "./user";

/**
 * Assessment: the work a teacher sets, and what a student hands in for it.
 *
 * Both factories fill in their own parents when the case does not name them.
 * `createSubmission()` on its own is a valid, complete submission — it quietly
 * gets a student, an activity, and the course section that activity hangs off.
 * A case that cares which student, or which section, passes it and the reader
 * can see that it mattered.
 */

export interface ActivityOptions {
  /** course_sections.section_id. A section is created if this is left out. */
  section_id?: number;
  activity_name?: string;
  /** activity_type_enum in the documentation, but a VarChar(20) in the
   *  schema: "individual", "group" or "parent". */
  activity_type?: string;
  description?: string;
  score_number?: number;
  announcement_date?: Date;
  deadline_date?: Date;
  is_average_score?: boolean;
  is_self_assessment?: boolean;
  detail?: Prisma.InputJsonValue;
  expected_level?: number;
}

export async function createActivity(options: ActivityOptions = {}) {
  const section_id = options.section_id ?? (await createCourse()).section_id;

  return prisma.activities.create({
    data: {
      section_id,
      activity_name: options.activity_name ?? "งานตัวอย่าง",
      activity_type: options.activity_type ?? "individual",
      description: options.description ?? "รายละเอียดงานตัวอย่าง",
      score_number: options.score_number ?? 10,
      announcement_date: options.announcement_date,
      deadline_date: options.deadline_date,
      is_average_score: options.is_average_score ?? false,
      is_self_assessment: options.is_self_assessment ?? false,
      detail: options.detail,
      expected_level: options.expected_level,
    },
  });
}

export interface SubmissionOptions {
  student_id?: string;
  activity_id?: number;
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADING" | "GRADED";
  score?: number;
  feedback?: string;
  submitted_at?: Date;
  graded_at?: Date;
  /** users.user_id of the grader. */
  graded_by?: string;
  is_bookmark?: boolean;
  remark?: string;
}

export async function createSubmission(options: SubmissionOptions = {}) {
  const student_id =
    options.student_id ?? (await createStudent()).student_id;
  const activity_id = options.activity_id ?? (await createActivity()).id;

  return prisma.student_activity.create({
    data: {
      student_id,
      activity_id,
      status: options.status ?? "SUBMITTED",
      score: options.score,
      feedback: options.feedback,
      submitted_at: options.submitted_at ?? new Date(),
      graded_at: options.graded_at,
      graded_by: options.graded_by,
      is_bookmark: options.is_bookmark ?? false,
      remark: options.remark,
    },
  });
}
