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
  /**
   * course_sections.section_id. A section is created if this is left out.
   *
   * `null` writes a piece of work that belongs to no section. The column is
   * nullable in the baseline migration and nothing in the API writes a null —
   * `POST /activity` requires one — so this is for the cases that pin what
   * happens if a row ever gets there another way.
   */
  section_id?: number | null;
  /** course_syllabus.id — the week of the lesson plan this piece of work sits
   *  in. There is no foreign key on this column; DELETE /lesson-plan nulls it
   *  by hand. */
  course_syllabus_id?: number;
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
  /**
   * subject_score_ratio.score_ratio_id — which of the section's score
   * categories this piece of work counts towards. The column is only reachable
   * through the relation, never as a scalar, which is why it is set here rather
   * than in the case.
   */
  score_weight_id?: number;
  /** attachments.attachment_id values, joined on through activity_attachments —
   *  what the teacher handed out with the work. Nothing here uploads anything;
   *  a case that wants an object in the bucket has to post to the endpoint. */
  attachment_ids?: number[];
}

export async function createActivity(options: ActivityOptions = {}) {
  const section_id =
    options.section_id === undefined
      ? (await createCourse()).section_id
      : options.section_id;

  const activity = await prisma.activities.create({
    data: {
      section_id,
      course_syllabus_id: options.course_syllabus_id,
      subject_score_ratio: options.score_weight_id
        ? { connect: { score_ratio_id: options.score_weight_id } }
        : undefined,
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

  if (options.attachment_ids?.length) {
    await prisma.activity_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        activity_id: activity.id,
        attachment_id,
      })),
    });
  }

  return activity;
}

export interface LearningActivityOptions {
  /** course_sections.section_id. A section is created if this is left out. */
  section_id?: number;
  /** course_syllabus.id — see the note on ActivityOptions. */
  course_syllabus_id?: number;
  learning_activity_name?: string;
  /** VarChar(20): "individual" or "group". */
  learning_activity_type?: string;
  announcement_date?: Date;
  deadline_date?: Date;
  detail?: Prisma.InputJsonValue;
  /** attachments.attachment_id values, joined on through
   *  learning_activity_attachments. */
  attachment_ids?: number[];
}

/**
 * The other half of the assessment model. A learning activity is the classroom
 * work — a lab, a discussion — as opposed to the graded assignments in
 * `activities`, and the two are separate tables all the way down to their own
 * submission and grouping tables. Anything that reads a week of the lesson plan
 * has to merge both.
 */
export async function createLearningActivity(
  options: LearningActivityOptions = {},
) {
  const section_id = options.section_id ?? (await createCourse()).section_id;

  const learningActivity = await prisma.learning_activities.create({
    data: {
      section_id,
      course_syllabus_id: options.course_syllabus_id,
      learning_activity_name:
        options.learning_activity_name ?? "กิจกรรมการเรียนรู้ตัวอย่าง",
      learning_activity_type: options.learning_activity_type ?? "individual",
      announcement_date: options.announcement_date,
      deadline_date: options.deadline_date,
      detail: options.detail,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.learning_activity_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        learning_activity_id: learningActivity.id,
        attachment_id,
      })),
    });
  }

  return learningActivity;
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
  /** attachments.attachment_id values, joined on through
   *  student_activity_attachments — the files the student handed in. */
  attachment_ids?: number[];
}

export async function createSubmission(options: SubmissionOptions = {}) {
  const student_id =
    options.student_id ?? (await createStudent()).student_id;
  const activity_id = options.activity_id ?? (await createActivity()).id;

  const submission = await prisma.student_activity.create({
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

  if (options.attachment_ids?.length) {
    await prisma.student_activity_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        student_activity_id: submission.id,
        attachment_id,
      })),
    });
  }

  return submission;
}

export interface LearningSubmissionOptions {
  student_id?: string;
  learning_activity_id?: number;
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADING" | "GRADED";
  feedback?: string;
  submitted_at?: Date;
  graded_at?: Date;
  /** users.user_id of the grader. */
  graded_by?: string;
  is_bookmark?: boolean;
  remark?: string;
  /** attachments.attachment_id values, joined on through
   *  student_learning_activity_attachments. */
  attachment_ids?: number[];
}

/**
 * The learning-activity half of the same idea. Note what is missing: there is
 * no score column on student_learning_activity at all, because classroom work
 * is marked done or not done rather than out of anything.
 */
export async function createLearningSubmission(
  options: LearningSubmissionOptions = {},
) {
  const student_id = options.student_id ?? (await createStudent()).student_id;
  const learning_activity_id =
    options.learning_activity_id ?? (await createLearningActivity()).id;

  const submission = await prisma.student_learning_activity.create({
    data: {
      student_id,
      learning_activity_id,
      status: options.status ?? "SUBMITTED",
      feedback: options.feedback,
      submitted_at: options.submitted_at ?? new Date(),
      graded_at: options.graded_at,
      graded_by: options.graded_by,
      is_bookmark: options.is_bookmark ?? false,
      remark: options.remark,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.student_learning_activity_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        student_learning_activity_id: submission.id,
        attachment_id,
      })),
    });
  }

  return submission;
}
