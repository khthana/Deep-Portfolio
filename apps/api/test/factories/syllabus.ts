import type { course_material_type } from "@prisma/client";
import prisma from "../../src/config/prisma";
import { createFileAttachment } from "./attachment";

/**
 * The weekly plan of a section, and the material hung off it.
 *
 * course_syllabus is one row per week. week_no is not a key and nothing in the
 * schema keeps it unique or contiguous — DELETE /lesson-plan renumbers the
 * remaining rows by hand — so a case about ordering has to say which week each
 * row is, and a case that is not about ordering can leave it alone.
 */

export interface LessonPlanOptions {
  /** course_sections.section_id. No foreign key on this column. */
  section_id: number;
  week_no?: number;
  title?: string;
  description?: string;
  remark?: string;
  /** users.user_id of the teacher who wrote it. Also has no foreign key. */
  created_by?: string;
}

export function createLessonPlan(options: LessonPlanOptions) {
  return prisma.course_syllabus.create({
    data: {
      section_id: options.section_id,
      week_no: options.week_no ?? 1,
      title: options.title ?? "หัวข้อประจำสัปดาห์",
      description: options.description ?? "รายละเอียดหัวข้อประจำสัปดาห์",
      remark: options.remark ?? "หมายเหตุ",
      created_by: options.created_by,
    },
  });
}

export interface CourseMaterialOptions {
  /** course_syllabus.id — this one *is* a foreign key, and it cascades. */
  course_syllabus_id: number;
  /** attachments.attachment_id. A file attachment is created if left out. */
  attachment_id?: number;
  type?: course_material_type;
}

export async function createCourseMaterial(options: CourseMaterialOptions) {
  const attachment_id =
    options.attachment_id ?? (await createFileAttachment()).attachment_id;

  return prisma.course_material.create({
    data: {
      course_syllabus_id: options.course_syllabus_id,
      attachment_id,
      type: options.type ?? "LECTURE",
    },
  });
}
