import prisma from "../config/prisma";
import {
  AddLessonPlanBody,
  GetStudentLessonPlanWithMaterialResp,
  UpdateLessonPlanBody,
} from "../models/lesson-plan.model";
import { checkIsOverAnnouncementDate } from "../utils/check-announcement-date";
import CourseMaterialService from "./course-material.service";

export default class LessonPlanService {
  private readonly courseMaterialService: CourseMaterialService;

  constructor() {
    this.courseMaterialService = new CourseMaterialService();
  }

  async addLessonPlan(body: AddLessonPlanBody) {
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

  async getLessonPlan(section_id: number) {
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
          ...syllabus,
          allActivities: allActivities.map((activity) => activity),
        };
      }),
    );

    return result;
  }

  async getStudentLessonPlanWithMaterial(
    section_id: number,
  ): Promise<GetStudentLessonPlanWithMaterialResp[]> {
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
          checkIsOverAnnouncementDate(activity.announcement_date),
        );

        const filteredLearningActivities = learningActivities.filter(
          (activity) => checkIsOverAnnouncementDate(activity.announcement_date),
        );

        const allActivities = [
          ...filteredActivities.map((activity) => activity.activity_name),
          ...filteredLearningActivities.map(
            (learningActivity) => learningActivity.learning_activity_name,
          ),
        ];

        return {
          ...syllabus,
          allActivities: allActivities.map((activity) => activity),
          course_materials:
            courseMaterial?.find(
              (material) => material.course_syllabus_id === syllabus.id,
            )?.course_materials || null,
        } as GetStudentLessonPlanWithMaterialResp;
      }),
    );

    return result;
  }

  async updateLessonPlan(body: UpdateLessonPlanBody) {
    const result = await prisma.course_syllabus.update({
      where: { id: body.lesson_plan_id },
      data: {
        title: body.title,
        description: body.description,
        remark: body.remark,
      },
    });

    return result;
  }

  async deleteLessonPlan(lesson_plan_id: number) {
    const lessonPlan = await prisma.course_syllabus.findUnique({
      where: { id: lesson_plan_id },
    });

    const result = await prisma.course_syllabus.delete({
      where: { id: lesson_plan_id },
    });

    const allLessonPlan = await prisma.course_syllabus.findMany({
      where: {
        created_by: lessonPlan?.created_by,
        section_id: lessonPlan?.section_id,
      },
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
