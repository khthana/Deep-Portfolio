import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../config/prisma";
import { AttachmentDetailResp } from "../models/announcement.model";
import {
  AddStudentActivityToBookmark,
  CalculateRubricScore,
  GetAllStudentActivity,
  GetAllSubmittedActivityByActivityIdResp,
  GetStudentActivityDetailResp,
  GradeStudentActivityData,
  Submission,
} from "../models/student-activity.model";
import { checkIsOverAnnouncementDate } from "../utils/check-announcement-date";
import ActivityService from "./activity.service";
import AttachmentsService from "./attachments.service";

export default class StudentActivityService {
  private readonly activityService: ActivityService;
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.activityService = new ActivityService();
    this.attachmentsService = new AttachmentsService();
  }

  async getAllSubmittedActivityByActivityId(
    activity_id: number,
  ): Promise<GetAllSubmittedActivityByActivityIdResp | null> {
    // 1. ดึงข้อมูล activity
    const activity = await prisma.activities.findUnique({
      where: { id: activity_id },
      select: {
        id: true,
        activity_name: true,
        deadline_date: true,
        score_number: true,
        activity_type: true,
      },
    });

    if (!activity) return null;

    // 2. แยก logic ตามประเภทงาน
    const submissions =
      activity.activity_type === "group"
        ? await this.getGroupSubmissions(activity_id)
        : await this.getIndividualSubmissions(activity_id);

    return {
      activity_id: activity.id,
      activity_name: activity.activity_name,
      deadline_date: activity.deadline_date,
      score: activity.score_number,
      submissions,
    };
  }

  // =========================
  // INDIVIDUAL SUBMISSION
  // =========================
  private async getIndividualSubmissions(
    activity_id: number,
  ): Promise<Submission[]> {
    const activities = await prisma.student_activity.findMany({
      where: {
        activity_id,
        status: { not: "NOT_SUBMITTED" },
      },
      select: {
        status: true,
        score: true,
        feedback: true,
        submitted_at: true,
        is_bookmark: true,
        id: true,
        remark: true,

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
      score: a.score ? Number(a.score) : null,
      feedback: a.feedback,
      is_bookmark: a.is_bookmark,
      remark: a.remark,
      student: a.student,
    }));
  }

  // =========================
  // GROUP SUBMISSION
  // =========================
  private async getGroupSubmissions(
    activity_id: number,
  ): Promise<Submission[]> {
    const groups = await prisma.student_activity_group.findMany({
      where: {
        activity_id,
        status: { not: "NOT_SUBMITTED" },
      },
      select: {
        student_activity_group_member: {
          where: { status: "ACCEPT" },
          include: {
            student: {
              select: {
                student_id: true,
                first_name_th: true,
                last_name_th: true,
              },
            },

            student_activity: {
              // where: { status: { not: "NOT_SUBMITTED" } },
              // take: 1,
              // orderBy: { submitted_at: "desc" },
              select: {
                status: true,
                score: true,
                feedback: true,
                submitted_at: true,
                is_bookmark: true,
                remark: true,
                id: true,
              },
            },
          },
        },
      },
    });

    if (groups.length <= 0) return [];
    return groups
      .filter((g) => g.student_activity_group_member.length > 0)
      .map((g) => {
        const activity = g.student_activity_group_member[0].student_activity!;

        // if (!activity) return [];

        return {
          submission_type: "GROUP",
          status: activity.status,
          submitted_at: activity.submitted_at,
          score: activity.score ? Number(activity.score) : null,
          feedback: activity.feedback,
          is_bookmark: activity.is_bookmark,
          remark: activity.remark,
          id: activity.id,
          group: {
            group_id: g.student_activity_group_member[0].group_id,
            members: g.student_activity_group_member.map((m) => m.student),
          },
        };
      });
  }

  async getStudentActivityDetail(
    student_activity_id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetStudentActivityDetailResp> {
    const prismaClient = tx ?? prisma;

    const studentActivity = await prismaClient.student_activity.findUnique({
      where: { id: student_activity_id },
      select: {
        id: true,
        activity_id: true,
        status: true,
        student_id: true,
        submitted_at: true,
        feedback: true,
        score: true,
        is_bookmark: true,
        graded_at: true,
        remark: true,

        student: {
          select: {
            first_name_th: true,
            last_name_th: true,
          },
        },

        student_activity_rubric_score: {
          select: {
            rubric_level_id: true,
            calculated_score: true,
            rubric_activity_mapping_id: true,
          },
        },
      },
    });

    const activityDetail = await this.activityService.getActivityDetail(
      studentActivity?.activity_id ?? 0,
      tx,
    );

    const attachments = await this.getAllAttachments(student_activity_id, tx);

    return {
      ...activityDetail,
      student_score: studentActivity?.score,
      ...studentActivity,
      submitted_files: attachments,
    } as GetStudentActivityDetailResp;
  }

  async getAllAttachments(
    student_activity_id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<AttachmentDetailResp> {
    const prismaClient = tx ?? prisma;

    const attachmentsIds =
      await prismaClient.student_activity_attachments.findMany({
        where: { student_activity_id },
        select: { attachment_id: true },
      });

    const activity_attachments = await this.attachmentsService.getAttachments(
      attachmentsIds,
      tx,
    );

    return activity_attachments;
  }

  async getAllStudentActivity(
    section_id: number,
    student_id: string,
  ): Promise<GetAllStudentActivity[]> {
    const allActivity = await prisma.activities.findMany({
      where: {
        section_id: section_id,
        student_activity: {
          some: { student_id },
        },
      },
      select: {
        id: true,
        activity_name: true,
        activity_type: true,
        deadline_date: true,
        announcement_date: true,
        score_number: true,
        score_ratio_id: true,
        detail: true,
        section_id: true,

        student_activity: {
          where: {
            student_id: student_id,
          },
          select: {
            id: true,
            status: true,
            score: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const result = await Promise.all(
      allActivity.map(async (activity) => {
        const scoreRatio = await prisma.subject_score_ratio.findUnique({
          where: { score_ratio_id: activity.score_ratio_id ?? 0 },
        });
        const attachments = await this.activityService.getAllAttachments(
          activity.id,
        );

        const studentAct = activity.student_activity[0];

        const displayStatus = this.getDisplayStatus(
          studentAct.status,
          activity.deadline_date,
        );

        return {
          ...scoreRatio,
          ...activity,
          attachments,
          student_activity: [
            {
              id: studentAct.id,
              status: displayStatus,
              received_point: studentAct.score,
            },
          ],
          activity_type: activity.activity_type.toUpperCase(),
        } as GetAllStudentActivity;
      }),
    );

    return result.filter((activity) =>
      checkIsOverAnnouncementDate(activity.announcement_date),
    );
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

  async getAllStudentActivityBySectionIdList(
    section_id_list: number[],
    student_id: string,
  ): Promise<GetAllStudentActivity[]> {
    const allActivity = await prisma.activities.findMany({
      where: {
        section_id: { in: section_id_list },

        student_activity: {
          some: { student_id },
        },
      },
      select: {
        id: true,
        activity_name: true,
        activity_type: true,
        deadline_date: true,
        announcement_date: true,
        score_number: true,
        score_ratio_id: true,
        detail: true,
        section_id: true,

        student_activity: {
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
        const scoreRatio = await prisma.subject_score_ratio.findUnique({
          where: { score_ratio_id: activity.score_ratio_id ?? 0 },
        });
        const attachments = await this.activityService.getAllAttachments(
          activity.id,
        );

        return {
          ...scoreRatio,
          ...activity,
          attachments,
          activity_type: activity.activity_type.toUpperCase(),
        } as GetAllStudentActivity;
      }),
    );

    return result.filter((activity) =>
      checkIsOverAnnouncementDate(activity.announcement_date),
    );
  }

  async gradeStudentActivity(data: GradeStudentActivityData) {
    return prisma.$transaction(async (tx) => {
      const totalScore = await this.calculateRubricScore({
        tx,
        studentActivityIds: [data.student_activity_id],
        rubric_detail: data.rubric_detail,
        full_score: data.full_score,
        total_level: data.total_level,
        feedback: data.feedback,
        remark: data.remark,
      });

      await this.calculateCloScore(
        tx,
        data.activity_id,
        [data.student_id],
        totalScore,
        data.full_score,
      );

      return {
        student_activity_id: data.student_activity_id,
        total_score: totalScore,
      };
    });
  }

  async gradeStudentGroupActivity(data: GradeStudentActivityData) {
    return prisma.$transaction(async (tx) => {
      const groupMember = await tx.student_activity_group_member.findUnique({
        where: { student_activity_id: data.student_activity_id },
        select: { group_id: true },
      });

      if (!groupMember) {
        throw new Error("Group not found");
      }

      const members = await tx.student_activity_group_member.findMany({
        where: { group_id: groupMember.group_id },
        select: { student_activity_id: true, student_id: true },
      });

      const studentActivityIds = members.map((m) => m.student_activity_id);
      const studentIds = members.map((m) => m.student_id);

      const totalScore = await this.calculateRubricScore({
        tx,
        studentActivityIds,
        rubric_detail: data.rubric_detail,
        full_score: data.full_score,
        total_level: data.total_level,
        feedback: data.feedback,
        remark: data.remark,
      });

      await tx.student_activity_group.update({
        where: { id: groupMember.group_id },
        data: { status: "GRADED" },
      });

      await this.calculateCloScore(
        tx,
        data.activity_id,
        studentIds,
        totalScore,
        data.full_score,
      );

      return {
        student_activity_id: data.student_activity_id,
        total_score: totalScore,
      };
    });
  }
  private async calculateCloScore(
    tx: Prisma.TransactionClient,
    activity_id: number,
    student_ids: string[],
    total_score: number,
    full_score: number,
  ) {
    const cloMappings = await tx.activity_clo_mapping.findMany({
      where: { activity_id },
      select: { id: true, clo_id: true, weight: true },
    });

    if (!cloMappings || cloMappings.length === 0) return;

    for (const cloItem of cloMappings) {
      const validWeight = Number(cloItem.weight);

      const maxCloScore = full_score * (validWeight / 100);

      await tx.activity_clo_mapping.update({
        where: { id: cloItem.id },
        data: { score: maxCloScore },
      });

      const studentCloScore = total_score * (validWeight / 100);

      for (const student_id of student_ids) {
        if (cloItem.clo_id) {
          const existingScore = await tx.activity_scores.findFirst({
            where: {
              student_id: student_id,
              activity_id: activity_id,
              clo_id: cloItem.clo_id.toString(),
            },
          });

          if (existingScore) {
            await tx.activity_scores.update({
              where: { score_id: existingScore.score_id },
              data: { score: studentCloScore },
            });
          } else {
            await tx.activity_scores.create({
              data: {
                student_id: student_id,
                activity_id: activity_id,
                clo_id: cloItem.clo_id.toString(),
                score: studentCloScore,
              },
            });
          }
        }
      }
    }
  }

  // private async calculateCloScore(
  //   tx: Prisma.TransactionClient,
  //   activity_id: number,
  // ) {
  //   const clo = await tx.activity_clo_mapping.findMany({
  //     where: { activity_id },
  //     select: { id: true, weight: true },
  //   });

  //   const totalAcitivityScore = await tx.student_activity.aggregate({
  //     _avg: { score: true },
  //     where: { activity_id, status: "GRADED" },
  //   });

  //   const rawScore = totalAcitivityScore._avg.score;
  //   if (!rawScore) return;

  //   const validScore = Number(rawScore);

  //   for (const cloItem of clo) {
  //     const validWeight = Number(cloItem.weight);

  //     const cloScore = (validScore * validWeight) / 100;

  //     await tx.activity_clo_mapping.update({
  //       where: { id: cloItem.id },
  //       data: { score: cloScore },
  //     });
  //   }
  // }

  private async calculateRubricScore({
    tx,
    studentActivityIds,
    rubric_detail,
    full_score,
    total_level,
    feedback,
    remark,
  }: CalculateRubricScore) {
    // 1. ลบ rubric เดิม
    await tx.student_activity_rubric_score.deleteMany({
      where: {
        student_activity_id: { in: studentActivityIds },
      },
    });

    // 2. preload rubric weight
    const rubricIds = rubric_detail.map((r) => r.rubric_id);

    const rubricMappings = await tx.rubric_activity_mapping.findMany({
      where: { id: { in: rubricIds } },
      select: { id: true, weight: true },
    });

    const rubricWeightMap = new Map(
      rubricMappings.map((r) => [r.id, r.weight]),
    );

    let totalScore = 0;
    const rubricScoreData: any[] = [];

    // 3. คำนวณคะแนน
    for (const rubric of rubric_detail) {
      const weight = rubricWeightMap.get(rubric.rubric_id);

      if (weight == null) {
        throw new Error("Invalid rubric data");
      }

      const fullScoreOfRubric = (full_score * weight) / 100;
      const calculatedScore =
        (fullScoreOfRubric * rubric.rubric_level_no) / total_level;

      totalScore += calculatedScore;

      for (const studentActivityId of studentActivityIds) {
        rubricScoreData.push({
          student_activity_id: studentActivityId,
          rubric_activity_mapping_id: rubric.rubric_id,
          rubric_level_id: rubric.rubric_level_id,
          calculated_score: calculatedScore,
        });
      }
    }

    // 4. insert rubric score
    if (rubricScoreData.length > 0) {
      await tx.student_activity_rubric_score.createMany({
        data: rubricScoreData,
      });
    }

    const roundedScore = Math.round(totalScore * 100) / 100;

    // 5. update student_activity
    await tx.student_activity.updateMany({
      where: { id: { in: studentActivityIds } },
      data: {
        score: roundedScore,
        feedback,
        status: "GRADED",
        graded_at: new Date(),
        remark,
      },
    });

    return roundedScore;
  }

  async addStudentActivityToBookmark(data: AddStudentActivityToBookmark) {
    return await prisma.student_activity.update({
      where: { id: data.student_activity_id },
      data: {
        is_bookmark: data.is_bookmark,
      },
      select: {
        is_bookmark: true,
      },
    });
  }

  async addStudentActivityGroupToBookmark(data: AddStudentActivityToBookmark) {
    const group = await prisma.student_activity_group_member.findFirst({
      where: {
        student_activity_id: data.student_activity_id,
      },
      select: {
        group_id: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    await prisma.student_activity.updateMany({
      where: {
        student_activity_group_member: {
          group_id: group.group_id,
        },
      },
      data: {
        is_bookmark: data.is_bookmark,
      },
    });

    return { is_bookmark: data.is_bookmark };
  }

  async getStudentActivityAttachments(student_activity_id: number) {
    const records = await prisma.student_activity_attachments.findMany({
      where: {
        student_activity_id,
      },
      select: {
        attachment_id: true,
      },
    });

    if (records.length === 0) return [];

    const result = await this.attachmentsService.getAttachments(records);

    const files = result.file.map((f) => ({
      attachment_id: f.attachment_id,
      url: f.file_path,
      file_path: f.file_path,
      original_filename: f.original_filename,
      file_size: f.file_size,
    }));

    const urls = result.url.map((u) => ({
      attachment_id: u.attachment_id,
      url: u.url,
      file_path: null,
      original_filename: u.title,
      file_size: null,
    }));

    return [...files, ...urls];
  }
}
