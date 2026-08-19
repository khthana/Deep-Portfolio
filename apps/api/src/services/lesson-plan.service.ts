import prisma from "../config/prisma";
import type {
  LessonPlanIdResp,
  LessonPlanRow,
  LessonPlanWeek,
  StudentLessonPlanWeek,
} from "@deep-portfolio/api-types";
import type { course_syllabus } from "@prisma/client";
import {
  AddLessonPlanBody,
  UpdateLessonPlanBody,
} from "../models/lesson-plan.model";
import { isAnnounced } from "../utils/is-announced";
import AttachmentsService from "./attachments.service";
import CourseMaterialService from "./course-material.service";
import MinIOService from "./upload.service";

/**
 * One row of `course_syllabus` as a caller reads it.
 *
 * The two reads that answer the row and the one write hand it over whole, so
 * the only thing between Prisma and the wire is the two dates. `/options` reads
 * the same table and does not go through here, because it answers a label and a
 * value rather than the row. `JSON.stringify` would turn
 * them into the same strings anyway; doing it here is what lets the return
 * types say `string | null` and be true (#68).
 */
const toLessonPlanRow = (row: course_syllabus): LessonPlanRow => ({
  ...row,
  created_at: row.created_at?.toISOString() ?? null,
  updated_at: row.updated_at?.toISOString() ?? null,
});

export default class LessonPlanService {
  private readonly courseMaterialService: CourseMaterialService;
  private readonly attachmentsService: AttachmentsService;
  private readonly uploadService: MinIOService;

  constructor() {
    this.courseMaterialService = new CourseMaterialService();
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
  }

  async addLessonPlan(body: AddLessonPlanBody): Promise<LessonPlanIdResp> {
    const result = await prisma.course_syllabus.create({
      data: {
        created_by: body.created_by,
        week_no: body.week_no,
        title: body.title,
        description: body.description,
        remark: body.remark,
        section_id: body.section_id,
      },
    });

    return { lesson_plan_id: result.id };
  }

  async getLessonPlan(section_id: number): Promise<LessonPlanWeek[]> {
    const courseSyllabus = await prisma.course_syllabus.findMany({
      where: { section_id: section_id },
      orderBy: { week_no: "asc" },
    });

    const result = await Promise.all(
      courseSyllabus.map(async (syllabus) => {
        const activities = await prisma.activities.findMany({
          where: { course_syllabus_id: syllabus.id },
        });

        const learningActivities = await prisma.learning_activities.findMany({
          where: { course_syllabus_id: syllabus.id },
        });

        const allActivities = [
          ...activities.map((activity) => activity.activity_name),
          ...learningActivities.map(
            (learningActivity) => learningActivity.learning_activity_name,
          ),
        ];

        return {
          ...toLessonPlanRow(syllabus),
          allActivities: allActivities.map((activity) => activity),
        };
      }),
    );

    return result;
  }

  async getStudentLessonPlanWithMaterial(
    section_id: number,
  ): Promise<StudentLessonPlanWeek[]> {
    const courseSyllabus = await prisma.course_syllabus.findMany({
      where: { section_id: section_id },

      orderBy: { week_no: "asc" },
    });

    const courseMaterial =
      await this.courseMaterialService.getCourseMaterial(section_id);

    const result = await Promise.all(
      courseSyllabus.map(async (syllabus) => {
        const activities = await prisma.activities.findMany({
          where: { course_syllabus_id: syllabus.id },
          select: {
            activity_name: true,
            announcement_date: true,
          },
        });

        const learningActivities = await prisma.learning_activities.findMany({
          where: { course_syllabus_id: syllabus.id },
          select: {
            learning_activity_name: true,
            announcement_date: true,
          },
        });

        const filteredActivities = activities.filter((activity) =>
          isAnnounced(activity.announcement_date),
        );

        const filteredLearningActivities = learningActivities.filter(
          (activity) => isAnnounced(activity.announcement_date),
        );

        const allActivities = [
          ...filteredActivities.map((activity) => activity.activity_name),
          ...filteredLearningActivities.map(
            (learningActivity) => learningActivity.learning_activity_name,
          ),
        ];

        return {
          ...toLessonPlanRow(syllabus),
          allActivities: allActivities.map((activity) => activity),
          course_materials:
            courseMaterial.find(
              (material) => material.course_syllabus_id === syllabus.id,
            )?.course_materials ?? null,
        };
      }),
    );

    return result;
  }

  async updateLessonPlan(body: UpdateLessonPlanBody): Promise<LessonPlanRow> {
    const result = await prisma.course_syllabus.update({
      where: { id: body.lesson_plan_id },
      data: {
        title: body.title,
        description: body.description,
        remark: body.remark,
      },
    });

    return toLessonPlanRow(result);
  }

  async deleteLessonPlan(lesson_plan_id: number): Promise<LessonPlanIdResp> {
    const lessonPlan = await prisma.course_syllabus.findUnique({
      where: { id: lesson_plan_id },
    });

    const { result, objects } = await prisma.$transaction(async (tx) => {
      // The week's material hangs off it by a foreign key that cascades, and
      // the course_material row is the only record of which attachments were
      // the week's own, so read them while they are still there (#34).
      const materials = await tx.course_material.findMany({
        where: { course_syllabus_id: lesson_plan_id },
        select: { attachment_id: true },
      });

      const result = await tx.course_syllabus.delete({
        where: { id: lesson_plan_id },
      });

      return {
        result,
        objects: await this.attachmentsService.deleteUnreferenced(
          materials.map((material) => material.attachment_id),
          tx,
        ),
      };
    });

    await this.uploadService.removeFiles(objects);

    // Every remaining week of the section, in the order they are displayed, so
    // that renumbering them 1..n below closes the gap the delete left instead
    // of shuffling them. Scoped by section only: week numbers belong to the
    // section's plan, and filtering by created_by as well used to leave a
    // co-teacher's weeks out of the renumbering and the numbers duplicated.
    const allLessonPlan = await prisma.course_syllabus.findMany({
      where: { section_id: lessonPlan?.section_id },
      orderBy: { week_no: "asc" },
    });

    for (let i = 0; i < allLessonPlan.length; i++) {
      await prisma.course_syllabus.update({
        where: { id: allLessonPlan[i].id },
        data: { week_no: i + 1 },
      });
    }

    await prisma.activities.updateMany({
      where: { course_syllabus_id: lesson_plan_id },
      data: { course_syllabus_id: null },
    });

    await prisma.learning_activities.updateMany({
      where: { course_syllabus_id: lesson_plan_id },
      data: { course_syllabus_id: null },
    });

    return { lesson_plan_id: result.id };
  }

  //--------------------------------------------------------

  async getLessonPlanOptions(section_id: number) {
    const result = await prisma.course_syllabus.findMany({
      where: { section_id: section_id },
      orderBy: { week_no: "asc" },
    });

    return result.map((item) => ({
      value: item.id,
      label: `สัปดาห์ที่ ${item.week_no}: ${item.title}`,
    }));
  }
}
