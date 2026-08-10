import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { AttachmentDetailResp } from "../models/announcement.model";
import {
  CreateLearningActivityReqBody,
  GetAllLearningActivityList,
  GetLearningActivityDetailResp,
  UpdateLearningActivityReqBody,
} from "../models/learning-activity.model";
import AttachmentsService from "./attachments.service";
import MinIOService from "./upload.service";

export default class LearningActivityService {
  private readonly uploadService: MinIOService;
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.uploadService = new MinIOService();
    this.attachmentsService = new AttachmentsService();
  }

  async createLearningActivity(data: CreateLearningActivityReqBody) {
    return prisma.$transaction(async (tx) => {
      const activity = await tx.learning_activities.create({
        data: {
          announcement_date: data.announcement_date,
          deadline_date: data.deadline_date,
          course_syllabus_id: data.course_syllabus_id,
          learning_activity_name: data.learning_activity_name,
          learning_activity_type: data.learning_activity_type.toLowerCase(),
          detail: data.detail,
          section_id: data.section_id,
        },
      });

      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "learning-activity",
      );

      if (attachmentIds.length > 0) {
        await tx.learning_activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            learning_activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }

      const studentIds = await tx.student_course.findMany({
        where: { section_id: data.section_id },
        select: { student_id: true },
      });

      if (studentIds.length > 0) {
        await tx.student_learning_activity.createMany({
          data: studentIds.map((student) => ({
            student_id: student.student_id,
            learning_activity_id: activity.id,
          })),
        });
      }

      return activity;
    });
  }

  async updateLearningActivity(data: UpdateLearningActivityReqBody) {
    const { activity, objects } = await prisma.$transaction(async (tx) => {
      const activity = await tx.learning_activities.update({
        where: { id: data.learning_activity_id },
        data: {
          announcement_date: data.announcement_date,
          deadline_date: data.deadline_date,
          course_syllabus_id: data.course_syllabus_id,
          learning_activity_name: data.learning_activity_name,
          learning_activity_type: data.learning_activity_type.toLowerCase(),
          detail: data.detail,
          section_id: data.section_id,
        },
      });

      // Scoped by the activity being edited: the id of an attachment says
      // nothing about who owns it, and matching on it alone unlinked the file
      // from every other activity that had it too. See BEHAVIOR-CHANGES.md.
      await tx.learning_activity_attachments.deleteMany({
        where: {
          learning_activity_id: activity.id,
          attachment_id: { in: data.remove_attachment_ids },
        },
      });

      // A join row is what makes an attachment reachable. Dropping the last
      // one strands it, so it goes with the link (#34).
      const objects = await this.attachmentsService.deleteUnreferenced(
        data.remove_attachment_ids,
        tx,
      );

      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: data.urls,
          files: data.files,
        },
        "learning-activity",
      );

      if (attachmentIds.length > 0) {
        await tx.learning_activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            learning_activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }

      return { activity, objects };
    });

    await this.uploadService.removeFiles(objects);

    return activity;
  }

  async getAllLearningActivity(
    section_id: number,
  ): Promise<GetAllLearningActivityList[]> {
    const activities = await prisma.learning_activities.findMany({
      where: { section_id: section_id },
      select: {
        id: true,
        learning_activity_name: true,
        learning_activity_type: true,
        announcement_date: true,
        deadline_date: true,
        section_id: true,
        course_syllabus_id: true,
      },
      orderBy: { id: "asc" },
    });

    const result = await Promise.all(
      activities.map(async (activity) => {
        let courseSyllabus;
        if (activity.course_syllabus_id) {
          courseSyllabus = await prisma.course_syllabus.findUnique({
            where: { id: activity.course_syllabus_id ?? undefined },
            select: {
              week_no: true,
            },
          });
        }

        const studentCount = await prisma.student_learning_activity.findMany({
          where: { learning_activity_id: activity.id },
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
          student_count: studentCount.length,
          submitted_count: submittedCount.length,
          pending_grading_count: pendingGradingCount.length,

          // attachments,
          week_no: courseSyllabus?.week_no,
          learning_activity_type: activity.learning_activity_type.toUpperCase(),
        } as GetAllLearningActivityList;
      }),
    );

    return result;
  }

  async getLearningActivityDetail(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetLearningActivityDetailResp | undefined> {
    const prismaClient = tx ?? prisma;

    const activity = await prismaClient.learning_activities.findUnique({
      where: { id },
    });

    if (!activity) return;

    // const courseSyllabus = await prismaClient.course_syllabus.findUnique({
    //   where: { id: activity.course_syllabus_id ?? undefined },
    // });

    const attachments = await this.getAllAttachments(activity.id, tx);

    return {
      ...activity,
      attachments,
      learning_activity_id: activity.id,
      // week_no: courseSyllabus?.week_no,
      learning_activity_type: activity.learning_activity_type.toUpperCase(),
    } as GetLearningActivityDetailResp;
  }

  async getAllAttachments(
    learning_activity_id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<AttachmentDetailResp> {
    const prismaClient = tx ?? prisma;

    const attachmentsIds =
      await prismaClient.learning_activity_attachments.findMany({
        where: { learning_activity_id: learning_activity_id },
        select: { attachment_id: true },
      });

    const learning_activity_attachments =
      await this.attachmentsService.getAttachments(attachmentsIds);

    return learning_activity_attachments;
  }

  async getLearningActivityOptions(section_id: number) {
    const learningActivities = await prisma.learning_activities.findMany({
      where: { section_id: section_id },
      orderBy: { id: "asc" },
    });

    return learningActivities.map((activity) => ({
      value: activity.id,
      label: activity.learning_activity_name,
    }));
  }

  async deleteLearningActivity(learning_activity_id: number) {
    const { result, objects } = await prisma.$transaction(async (tx) => {
      // Both sides of the work hang off this row — what the teacher handed out
      // and what the students handed in — and deleting it cascades every join
      // row away, so read them while they are still there (#34).
      const handedOut = await tx.learning_activity_attachments.findMany({
        where: { learning_activity_id },
        select: { attachment_id: true },
      });
      const handedIn = await tx.student_learning_activity_attachments.findMany({
        where: { student_learning_activity: { learning_activity_id } },
        select: { attachment_id: true },
      });

      const result = await tx.learning_activities.delete({
        where: { id: learning_activity_id },
      });

      return {
        result,
        objects: await this.attachmentsService.deleteUnreferenced(
          [...handedOut, ...handedIn].map((link) => link.attachment_id),
          tx,
        ),
      };
    });

    await this.uploadService.removeFiles(objects);

    return result;
  }
}
