import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { AttachmentDetailResp } from "../models/announcement.model";
import { AddStudentActivity } from "../models/student-activity.model";
import {
  AddStudentLearningActivityToBookmark,
  GetAllStudentLearningActivity,
  GetAllSubmittedLearningActivityByLearningActivityIdResp,
  GetStudentLearningActivityDetailResp,
  GradeStudentLearningActivityData,
  Submission,
} from "../models/student-learning-activity.model";
import { checkIsOverAnnouncementDate } from "../utils/check-announcement-date";
import ActivityService from "./activity.service";
import AttachmentsService from "./attachments.service";
import LearningActivityService from "./learning-activity.service";

export default class StudentLearningActivityService {
  private readonly learningActivityService: LearningActivityService;
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.learningActivityService = new LearningActivityService();
    this.attachmentsService = new AttachmentsService();
  }

  async getAllSubmittedLearningActivityByLearningActivityId(
    learning_activity_id: number,
  ): Promise<GetAllSubmittedLearningActivityByLearningActivityIdResp | null> {
    // 1. ดึงข้อมูล activity
    const activity = await prisma.learning_activities.findUnique({
      where: { id: learning_activity_id },
      select: {
        id: true,
        learning_activity_name: true,
        deadline_date: true,
        learning_activity_type: true,
      },
    });

    if (!activity) return null;

    // 2. แยก logic ตามประเภทงาน
    // const submissions =
    //   await this.getIndividualSubmissions(learning_activity_id);
    const submissions =
      activity.learning_activity_type === "group"
        ? await this.getGroupSubmissions(learning_activity_id)
        : await this.getIndividualSubmissions(learning_activity_id);

    return {
      learning_activity_id: activity.id,
      learning_activity_name: activity.learning_activity_name,
      deadline_date: activity.deadline_date,
      submissions,
    };
  }

  // =========================
  // INDIVIDUAL SUBMISSION
  // =========================
  private async getIndividualSubmissions(
    learning_activity_id: number,
  ): Promise<Submission[]> {
    const activities = await prisma.student_learning_activity.findMany({
      where: {
        learning_activity_id,
        status: { not: "NOT_SUBMITTED" },
      },
      select: {
        status: true,
        feedback: true,
        submitted_at: true,
        is_bookmark: true,
        remark: true,
        id: true,
        student: {
          select: {
            student_id: true,
            first_name_th: true,
            last_name_th: true,
          },
        },
      },
      orderBy: {
        submitted_at: "desc",
      },
    });

    return activities.map((a) => ({
      id: a.id,
      submission_type: "INDIVIDUAL",
      status: a.status,
      submitted_at: a.submitted_at,
      feedback: a.feedback,
      remark: a.remark,
      is_bookmark: a.is_bookmark,
      student: a.student,
    }));
  }

  // =========================
  // GROUP SUBMISSION
  // =========================
  private async getGroupSubmissions(
    learning_activity_id: number,
  ): Promise<Submission[]> {
    const groups = await prisma.student_learning_activity_group.findMany({
      where: {
        learning_activity_id,
        status: { not: "NOT_SUBMITTED" },
      },
      select: {
        student_learning_activity_group_member: {
          where: { status: "ACCEPT" },
          include: {
            student: {
              select: {
                student_id: true,
                first_name_th: true,
                last_name_th: true,
              },
            },

            student_learning_activity: {
              // where: { status: { not: "NOT_SUBMITTED" } },
              // take: 1,
              // orderBy: { submitted_at: "desc" },
              select: {
                status: true,
                feedback: true,
                remark: true,
                submitted_at: true,
                is_bookmark: true,
                id: true,
              },
            },
          },
        },
      },
    });

    if (groups.length <= 0) return [];
    return groups
      .filter((g) => g.student_learning_activity_group_member.length > 0)
      .map((g) => {
        const activity =
          g.student_learning_activity_group_member[0]
            .student_learning_activity!;

        // if (!activity) return [];

        return {
          submission_type: "GROUP",
          status: activity.status,
          submitted_at: activity.submitted_at,
          // score: activity.score ? Number(activity.score) : null,
          feedback: activity.feedback,
          remark: activity.remark,
          is_bookmark: activity.is_bookmark,
          id: activity.id,
          group: {
            group_id: g.student_learning_activity_group_member[0].group_id,
            members: g.student_learning_activity_group_member.map(
              (m) => m.student,
            ),
          },
        };
      });
  }

  async getAllStudentLearningActivity(
    section_id: number,
    student_id: string,
  ): Promise<GetAllStudentLearningActivity[]> {
    const allActivity = await prisma.learning_activities.findMany({
      where: {
        section_id: section_id,
        student_learning_activity: {
          some: { student_id },
        },
      },
      select: {
        id: true,
        learning_activity_name: true,
        learning_activity_type: true,
        deadline_date: true,
        announcement_date: true,
        course_syllabus_id: true,

        student_learning_activity: {
          where: {
            student_id: student_id,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const result = await Promise.all(
      allActivity.map(async (activity) => {
        let courseSyllabus;

        if (activity.course_syllabus_id) {
          courseSyllabus = await prisma.course_syllabus.findUnique({
            where: { id: activity.course_syllabus_id },
          });
        }

        const attachments =
          await this.learningActivityService.getAllAttachments(activity.id);

        const studentAct = activity.student_learning_activity[0];

        const displayStatus = this.getDisplayStatus(
          studentAct.status,
          activity.deadline_date,
        );

        return {
          ...activity,
          attachments,
          week_no: courseSyllabus?.week_no,
          student_learning_activity: [
            {
              id: studentAct.id,
              status: displayStatus,
            },
          ],
          learning_activity_type: activity.learning_activity_type.toUpperCase(),
        } as GetAllStudentLearningActivity;
      }),
    );

    return result.filter((activity) =>
      checkIsOverAnnouncementDate(activity.announcement_date),
    );
  }

  async getStudentLearningActivityDetail(
    student_learning_activity_id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetStudentLearningActivityDetailResp> {
    const prismaClient = tx ?? prisma;

    const studentLearningActivity =
      await prismaClient.student_learning_activity.findUnique({
        where: { id: student_learning_activity_id },
        select: {
          id: true,
          learning_activity_id: true,
          status: true,
          student_id: true,
          submitted_at: true,
          graded_at: true,
          feedback: true,
          is_bookmark: true,
          remark: true,

          student: {
            select: {
              first_name_th: true,
              last_name_th: true,
            },
          },
        },
      });

    const activityDetail =
      await this.learningActivityService.getLearningActivityDetail(
        studentLearningActivity?.learning_activity_id ?? 0,
        tx,
      );

    const attachments = await this.getAllAttachments(
      student_learning_activity_id,
      tx,
    );

    return {
      ...activityDetail,
      ...studentLearningActivity,
      submitted_files: attachments,
    } as GetStudentLearningActivityDetailResp;
  }

  private getDisplayStatus(status: string, deadline: Date | null): string {
    if (
      status === "NOT_SUBMITTED" &&
      deadline &&
      deadline.getTime() < Date.now()
    ) {
      return "LATE";
    }

    return status;
  }

  async getAllAttachments(
    student_learning_activity_id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<AttachmentDetailResp> {
    const prismaClient = tx ?? prisma;

    const attachmentsIds =
      await prismaClient.student_learning_activity_attachments.findMany({
        where: { student_learning_activity_id },
        select: { attachment_id: true },
      });

    const activity_attachments = this.attachmentsService.getAttachments(
      attachmentsIds,
      tx,
    );

    return activity_attachments;
  }

  async getAllStudentLearningActivityBySectionIdList(
    section_id_list: number[],
    student_id: string,
  ): Promise<GetAllStudentLearningActivity[]> {
    const allActivity = await prisma.learning_activities.findMany({
      where: {
        section_id: { in: section_id_list },

        student_learning_activity: {
          some: { student_id },
        },
      },
      select: {
        id: true,
        learning_activity_name: true,
        learning_activity_type: true,
        deadline_date: true,
        announcement_date: true,
        course_syllabus_id: true,
        section_id: true,
        detail: true,

        student_learning_activity: {
          where: {
            student_id: student_id,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const result = await Promise.all(
      allActivity.map(async (activity) => {
        let courseSyllabus;

        if (activity.course_syllabus_id) {
          courseSyllabus = await prisma.course_syllabus.findUnique({
            where: { id: activity.course_syllabus_id },
          });
        }

        const attachments =
          await this.learningActivityService.getAllAttachments(activity.id);

        return {
          ...activity,
          attachments,
          week_no: courseSyllabus?.week_no,
          learning_activity_type: activity.learning_activity_type.toUpperCase(),
        } as GetAllStudentLearningActivity;
      }),
    );

    return result.filter((activity) =>
      checkIsOverAnnouncementDate(activity.announcement_date),
    );
  }

  async gradeStudentLearningActivity(data: GradeStudentLearningActivityData) {
    return prisma.student_learning_activity.update({
      where: { id: data.student_learning_activity_id },
      data: {
        remark: data.remark,
        feedback: data.feedback,
        status: "GRADED",
        graded_at: new Date(),
      },
    });
  }

  async gradeStudentGroupLearningActivity(
    data: GradeStudentLearningActivityData,
  ) {
    return prisma.$transaction(async (tx) => {
      const groupMember =
        await tx.student_learning_activity_group_member.findUnique({
          where: {
            student_learning_activity_id: data.student_learning_activity_id,
          },
          select: { group_id: true },
        });

      if (!groupMember) {
        throw new Error("Group not found");
      }

      const members = await tx.student_learning_activity_group_member.findMany({
        where: { group_id: groupMember.group_id },
        select: { student_learning_activity_id: true },
      });

      const studentActivityIds = members.map(
        (m) => m.student_learning_activity_id,
      );

      await tx.student_learning_activity.updateMany({
        where: { id: { in: studentActivityIds } },
        data: {
          feedback: data.feedback,
          status: "GRADED",
          graded_at: new Date(),
          remark: data.remark,
        },
      });

      await tx.student_learning_activity_group.update({
        where: { id: groupMember.group_id },
        data: { status: "GRADED" },
      });

      return {
        student_learning_activity_id: data.student_learning_activity_id,
      };
    });
  }

  async addStudentLearningActivityToBookmark(
    data: AddStudentLearningActivityToBookmark,
  ) {
    return await prisma.student_learning_activity.update({
      where: { id: data.student_learning_activity_id },
      data: {
        is_bookmark: data.is_bookmark,
      },
      select: {
        is_bookmark: true,
      },
    });
  }

  async addStudentLearningActivityGroupToBookmark(
    data: AddStudentLearningActivityToBookmark,
  ) {
    const group = await prisma.student_learning_activity_group_member.findFirst(
      {
        where: {
          student_learning_activity_id: data.student_learning_activity_id,
        },
        select: {
          group_id: true,
        },
      },
    );

    if (!group) {
      throw new Error("Group not found");
    }

    await prisma.student_learning_activity.updateMany({
      where: {
        student_learning_activity_group_member: {
          group_id: group.group_id,
        },
      },
      data: {
        is_bookmark: data.is_bookmark,
      },
    });

    return { is_bookmark: data.is_bookmark };
  }
}
