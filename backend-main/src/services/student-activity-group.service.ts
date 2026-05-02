import prisma from "../config/prisma";
import {
  CreateStudentActivityGroupBody,
  GetStudentActivityGroupResp,
  GetStudentsWithoutGroupResp,
  GroupRole,
  MemberDetailResp,
  UpdateStudentActivityGroupBody,
} from "../models/student-activity-group.model";
import GroupService from "./group.service";
import crypto from "crypto";

export default class StudentActivityGroupService {
  private readonly groupService: GroupService;

  constructor() {
    this.groupService = new GroupService();
  }
  async createStudentActivityGroup(data: CreateStudentActivityGroupBody) {
    const emailsToSend: { email: string; token: string; name: string }[] = [];
    let inviterName = "";

    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.student_activity_group.create({
        data: {
          activity_id: data.activity_id,
          created_by:
            data.members.find((m) => m.role === "LEADER")?.student_id ?? "",
        },
        select: { id: true },
      });

      for (const member of data.members) {
        let studentActivity = await tx.student_activity.findFirst({
          where: {
            activity_id: data.activity_id,
            student_id: member.student_id,
          },
          select: { id: true },
        });

        if (!studentActivity) {
          studentActivity = await tx.student_activity.create({
            data: {
              activity_id: data.activity_id,
              student_id: member.student_id,
              status: "NOT_SUBMITTED",
            },
            select: { id: true },
          });
        }

        const userDetail = await tx.users.findUnique({
          where: { user_id: member.student_id },
          select: { first_name_th: true, last_name_th: true, email: true },
        });

        if (!userDetail || !userDetail.email) continue;

        const inviteToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 7);

        await tx.student_activity_group_member.create({
          data: {
            group_id: group.id,
            student_id: member.student_id,
            role: member.role,
            student_activity_id: studentActivity.id,
            invite_token: member.role === "LEADER" ? null : inviteToken,
            token_expiry: member.role === "LEADER" ? null : tokenExpiry,
            status: member.role === "LEADER" ? "ACCEPT" : "PENDING",
          },
        });

        if (member.role !== "LEADER") {
          emailsToSend.push({
            email: userDetail.email,
            token: inviteToken,
            name: `${userDetail.first_name_th} ${userDetail.last_name_th}`,
          });
        } else {
          inviterName = `${userDetail.first_name_th} ${userDetail.last_name_th}`;
        }
      }

      return { group_id: group.id };
    });

    const activity = await prisma.activities.findUnique({
      where: { id: data.activity_id },
    });

    for (const mailData of emailsToSend) {
      try {
        await this.groupService.sendInviteEmail(
          mailData.email,
          inviterName,
          mailData.token,
          activity?.activity_name ?? "",
          "activity",
        );
      } catch (err) {
        console.error(`ไม่สามารถส่งอีเมลหา ${mailData.email} ได้:`, err);
        // ตรงนี้ DB บันทึกไปแล้ว แค่เมลไม่ไป อาจจะทำระบบแจ้งเตือนทีหลัง
      }
    }

    return result;
  }

  async updateStudentActivityGroup(data: UpdateStudentActivityGroupBody) {
    const emailsToSend: { email: string; token: string; name: string }[] = [];
    let inviterName = "";

    const result = await prisma.$transaction(async (tx) => {
      // 1. 🎯 ดึงข้อมูลสมาชิก "ชุดเดิม" ออกมาเก็บไว้ก่อนลบทิ้ง
      const existingMembers = await tx.student_activity_group_member.findMany({
        where: { group_id: data.group_id },
      });

      // 2. ลบสมาชิกเดิมออกทั้งหมดเพื่อเตรียมจัดกลุ่มใหม่
      const group = await tx.student_activity_group.update({
        where: { id: data.group_id },
        data: {
          student_activity_group_member: {
            deleteMany: { group_id: data.group_id },
          },
        },
        select: { activity_id: true },
      });

      for (const member of data.members) {
        let studentActivity = await tx.student_activity.findFirst({
          where: {
            activity_id: group.activity_id,
            student_id: member.student_id,
          },
          select: { id: true },
        });

        if (!studentActivity) {
          studentActivity = await tx.student_activity.create({
            data: {
              activity_id: group.activity_id,
              student_id: member.student_id,
              status: "NOT_SUBMITTED",
            },
            select: { id: true },
          });
        }

        const userDetail = await tx.users.findUnique({
          where: { user_id: member.student_id },
          select: { first_name_th: true, last_name_th: true, email: true },
        });

        if (!userDetail || !userDetail.email) continue;

        const oldMemberData = existingMembers.find(
          (old) => old.student_id === member.student_id,
        );

        if (member.role === "LEADER") {
          await tx.student_activity_group_member.create({
            data: {
              group_id: data.group_id,
              student_id: member.student_id,
              role: member.role,
              student_activity_id: studentActivity.id,
              invite_token: null,
              token_expiry: null,
              status: "ACCEPT",
            },
          });
          inviterName = `${userDetail.first_name_th} ${userDetail.last_name_th}`;
        } else if (oldMemberData) {
          await tx.student_activity_group_member.create({
            data: {
              group_id: data.group_id,
              student_id: member.student_id,
              role: member.role,
              student_activity_id: studentActivity.id,
              invite_token: oldMemberData.invite_token,
              token_expiry: oldMemberData.token_expiry,
              status: oldMemberData.status,
            },
          });
        } else {
          const inviteToken = crypto.randomBytes(32).toString("hex");
          const tokenExpiry = new Date();
          tokenExpiry.setDate(tokenExpiry.getDate() + 7);

          await tx.student_activity_group_member.create({
            data: {
              group_id: data.group_id,
              student_id: member.student_id,
              role: member.role,
              student_activity_id: studentActivity.id,
              invite_token: inviteToken,
              token_expiry: tokenExpiry,
              status: "PENDING",
            },
          });

          emailsToSend.push({
            email: userDetail.email,
            token: inviteToken,
            name: `${userDetail.first_name_th} ${userDetail.last_name_th}`,
          });
        }
      }

      return { group_id: data.group_id, activity_id: group.activity_id };
    });

    const activity = await prisma.activities.findUnique({
      where: { id: result.activity_id },
      select: { activity_name: true },
    });

    for (const mailData of emailsToSend) {
      try {
        await this.groupService.sendInviteEmail(
          mailData.email,
          inviterName,
          mailData.token,
          activity?.activity_name ?? "",
          "activity",
        );
      } catch (err) {
        console.error(`ไม่สามารถส่งอีเมลหา ${mailData.email} ได้:`, err);
      }
    }

    return { group_id: result.group_id };
  }

  async getStudentsWithoutGroup(
    section_id: number,
    activity_id: number,
  ): Promise<GetStudentsWithoutGroupResp[]> {
    const studentsInSec = await prisma.student_course.findMany({
      where: {
        section_id: section_id,
      },
      select: {
        student_id: true,
      },
    });

    const studentIds = studentsInSec.map((student) => student.student_id);

    const studentsWithoutGroup = await prisma.student.findMany({
      where: {
        student_id: { in: studentIds },
        student_activity_group_member: {
          none: {
            student_activity_group: {
              activity_id,
            },
          },
        },
      },
      select: {
        student_id: true,
        full_name_th: true,
      },
    });

    return studentsWithoutGroup as GetStudentsWithoutGroupResp[];
  }

  async getStudentActivityGroup(
    student_id: string,
    activity_id: number,
  ): Promise<GetStudentActivityGroupResp | null> {
    const group = await prisma.student_activity_group.findFirst({
      where: {
        activity_id: activity_id,
        student_activity_group_member: {
          some: {
            student_id: student_id,
          },
        },
      },
      select: {
        id: true,
        student_activity_group_member: {
          select: {
            student_id: true,
            role: true,
            status: true,
            student: {
              select: {
                full_name_th: true,
              },
            },
          },
        },
      },
    });

    if (group === null) return null;

    const members: MemberDetailResp[] = group.student_activity_group_member.map(
      (member) => ({
        student_id: member.student_id,
        role: member.role,
        student_name: member.student.full_name_th ?? "",
        status: member.status,
      }),
    );

    return {
      group_id: group.id,
      members: members,
    };
  }

  async getStudentActivityGroupInSec(
    section_id: number,
    student_id: string,
  ): Promise<GetStudentActivityGroupResp[]> {
    const groups = await prisma.student_activity_group.findMany({
      where: {
        activities: {
          section_id: section_id,
        },
        student_activity_group_member: {
          some: {
            student_id: student_id,
          },
        },
      },
      select: {
        id: true,
        student_activity_group_member: {
          select: {
            student_id: true,
            role: true,
            status: true,

            student: {
              select: {
                full_name_th: true,
              },
            },
          },
        },
      },
    });

    const uniqueGroups: GetStudentActivityGroupResp[] = [];
    const seenSignatures = new Set<string>();

    for (const group of groups) {
      const members: MemberDetailResp[] =
        group.student_activity_group_member.map((m) => ({
          student_id: m.student_id,
          role: m.role as GroupRole,
          student_name: m.student?.full_name_th || "",
          status: m.status,
        }));

      const groupSignature = members
        .map((m) => m.student_id)
        .sort()
        .join(",");

      if (!seenSignatures.has(groupSignature)) {
        seenSignatures.add(groupSignature);
        uniqueGroups.push({
          group_id: group.id,
          members: members,
        });
      }
    }

    return uniqueGroups;
  }
}
