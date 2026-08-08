import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../config/prisma";
import {
  GetActivityDetailResp,
  CreateActivityReqBody,
  GetAllActivityList,
  UpdateActivityReqBody,
} from "../models/activity.model";
import { AttachmentDetailResp } from "../models/announcement.model";
import { ClassworkType } from "../models/student.model";
import AttachmentsService from "./attachments.service";

export default class ActivityService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
  }

  async createActivity(data: CreateActivityReqBody) {
    return prisma.$transaction(async (tx) => {
      const activity = await tx.activities.create({
        data: {
          announcement_date: data.announcement_date,
          deadline_date: data.deadline_date,
          course_syllabus_id: data.course_syllabus_id,
          activity_name: data.activity_name,
          score_number: data.score_number,
          activity_type: data.activity_type.toLowerCase(),
          detail: data.detail,
          is_average_score: data.is_average_score,
          is_self_assessment: data.is_self_assessment,
          section_id: data.section_id,
          expected_level: data.expected_level,
          subject_score_ratio: data.score_ratio_id
            ? { connect: { score_ratio_id: data.score_ratio_id } }
            : undefined,
        },
      });

      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "activity",
      );

      if (attachmentIds.length > 0) {
        await tx.activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }

      for (const rubric of data.rubric) {
        const createdRubric = await tx.rubric_activity_mapping.create({
          data: {
            activity_id: activity.id,
            criteria: rubric.criteria,
            weight: rubric.weight,
          },
        });

        await tx.rubric_levels.createMany({
          data: rubric.levels.map((level) => ({
            rubric_id: createdRubric.id,
            level_no: level.level_no,
            description: level.description,
          })),
        });
      }

      const studentIds = await tx.student_course.findMany({
        where: { section_id: data.section_id },
        select: { student_id: true },
      });

      if (studentIds.length > 0) {
        await tx.student_activity.createMany({
          data: studentIds.map((student) => ({
            student_id: student.student_id,
            activity_id: activity.id,
          })),
        });
      }

      return activity;
    });
  }

  async updateActivity(data: UpdateActivityReqBody) {
    return prisma.$transaction(async (tx) => {
      const activity = await tx.activities.update({
        where: { id: data.activity_id },
        data: {
          announcement_date: data.announcement_date,
          deadline_date: data.deadline_date,
          course_syllabus_id: data.course_syllabus_id,
          activity_name: data.activity_name,
          score_number: data.score_number,
          activity_type: data.activity_type.toLowerCase(),
          detail: data.detail,
          is_average_score: data.is_average_score,
          is_self_assessment: data.is_self_assessment,
          section_id: data.section_id,
          expected_level: data.expected_level,
          subject_score_ratio: data.score_ratio_id
            ? { connect: { score_ratio_id: data.score_ratio_id } }
            : undefined,
        },
      });

      await tx.activity_attachments.deleteMany({
        where: { attachment_id: { in: data.remove_attachment_ids } },
      });

      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "activity",
      );

      if (attachmentIds.length > 0) {
        await tx.activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }

      await tx.rubric_activity_mapping.deleteMany({
        where: { activity_id: data.activity_id },
      });

      for (const rubric of data.rubric) {
        const createdRubric = await tx.rubric_activity_mapping.create({
          data: {
            activity_id: activity.id,
            criteria: rubric.criteria,
            weight: rubric.weight,
          },
        });

        await tx.rubric_levels.createMany({
          data: rubric.levels.map((level) => ({
            rubric_id: createdRubric.id,
            level_no: level.level_no,
            description: level.description,
          })),
        });
      }

      return activity;
    });
  }

  async getAllActivity(section_id: number): Promise<GetAllActivityList[]> {
    const allActivity = await prisma.activities.findMany({
      where: { section_id: section_id },
      select: {
        id: true,
        activity_name: true,
        activity_type: true,
        score_ratio_id: true,
        deadline_date: true,
        announcement_date: true,
        section_id: true,
      },
      orderBy: { id: "asc" },
    });

    const result = await Promise.all(
      allActivity.map(async (activity) => {
        const scoreRatio = await prisma.subject_score_ratio.findUnique({
          where: { score_ratio_id: activity.score_ratio_id ?? 0 },
          select: {
            score_ratio_id: true,
            sequence_order: true,
            score_category: true,
            weight: true,
            section_id: true,
          },
        });

        const studentCount = await prisma.student_activity.findMany({
          where: { activity_id: activity.id },
        });

        const submittedCount = studentCount.filter(
          (student) => student.status !== "NOT_SUBMITTED",
        );
        const pendingGradingCount = studentCount.filter(
          (student) =>
            student.status === "SUBMITTED" || student.status === "GRADING",
        );

        // const attachments = await this.getAllAttachments(activity.id);

        return {
          ...activity,
          subject_score_ratio: scoreRatio,
          student_count: studentCount.length,
          submitted_count: submittedCount.length,
          pending_grading_count: pendingGradingCount.length,
          // attachments,
          activity_type: activity.activity_type.toUpperCase(),
        } as GetAllActivityList;
      }),
    );

    return result;
  }

  async getActivityDetail(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetActivityDetailResp | undefined> {
    const prismaClient = tx ?? prisma;

    const activity = await prismaClient.activities.findUnique({
      where: { id },
      include: {
        rubric_activity_mapping: {
          include: {
            rubric_levels: true,
          },
        },
        subject_score_ratio: true,
      },
    });

    if (!activity) return;

    const attachments = await this.getAllAttachments(activity.id, tx);

    return {
      ...activity,
      activity_id: activity.id,
      activity_type: activity.activity_type.toUpperCase() as ClassworkType,
      attachments,
    } as GetActivityDetailResp;
  }

  async getAllAttachments(
    activity_id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<AttachmentDetailResp> {
    const prismaClient = tx ?? prisma;

    const attachmentsIds = await prismaClient.activity_attachments.findMany({
      where: { activity_id: activity_id },
      select: { attachment_id: true },
    });

    const activity_attachments =
      await this.attachmentsService.getAttachments(attachmentsIds);

    return activity_attachments;
  }

  async getActivityOptions(section_id: number) {
    const activities = await prisma.activities.findMany({
      where: { section_id: section_id },
      orderBy: { id: "asc" },
    });

    return activities.map((activity) => ({
      value: activity.id,
      label: activity.activity_name,
    }));
  }

  async deleteActivity(activity_id: number) {
    const result = await prisma.activities.delete({
      where: { id: activity_id },
    });

    return result;
  }
}
