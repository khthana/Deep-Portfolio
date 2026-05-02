import prisma from "../config/prisma";
import crypto from "crypto";
import {
  CreateStudentActivityGroupBody,
  GetStudentActivityGroupResp,
  GetStudentsWithoutGroupResp,
  GroupRole,
  MemberDetailResp,
  UpdateStudentActivityGroupBody,
} from "../models/student-activity-group.model";
import {
  CreateStudentLearningActivityGroupBody,
  GetStudentLearningActivityGroupResp,
  UpdateStudentLearningActivityGroupBody,
} from "../models/student-learning-activity-group.model";
import GroupService from "./group.service";

export default class StudentLearningActivityGroupService {
  private readonly groupService: GroupService;

  constructor() {
    this.groupService = new GroupService();
  }

  async createStudentLearningActivityGroup(
    data: CreateStudentLearningActivityGroupBody,
  ) {
    // 1. เตรียม Array ไว้เก็บข้อมูลคนที่จะต้องส่งอีเมลหา และตัวแปรเก็บชื่อคนเชิญ
    const emailsToSend: { email: string; token: string; name: string }[] = [];
    let inviterName = "";

    // 2. ทำ Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 2.1 สร้างกลุ่ม
      const group = await tx.student_learning_activity_group.create({
        data: {
          learning_activity_id: data.learning_activity_id,
          created_by:
            data.members.find((m) => m.role === "LEADER")?.student_id ?? "",
        },
        select: { id: true },
      });

      for (const member of data.members) {
        // 2.2 หา student_learning_activity เดิม
        let studentActivity = await tx.student_learning_activity.findFirst({
          where: {
            learning_activity_id: data.learning_activity_id,
            student_id: member.student_id,
          },
          select: { id: true },
        });

        // 2.3 ถ้าไม่มี → สร้างใหม่
        if (!studentActivity) {
          studentActivity = await tx.student_learning_activity.create({
            data: {
              learning_activity_id: data.learning_activity_id,
              student_id: member.student_id,
              status: "NOT_SUBMITTED",
            },
            select: { id: true },
          });
        }

        // 2.4 ดึงข้อมูลผู้ใช้เพื่อเอาชื่อและอีเมล
        const userDetail = await tx.users.findUnique({
          where: { user_id: member.student_id },
          select: { first_name_th: true, last_name_th: true, email: true },
        });

        if (!userDetail || !userDetail.email) continue;

        // 2.5 สร้าง Token และวันหมดอายุ
        const inviteToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 7);

        // 2.6 สร้าง group member + ผูก student_learning_activity พร้อมใส่สถานะและ Token
        await tx.student_learning_activity_group_member.create({
          data: {
            group_id: group.id,
            student_id: member.student_id,
            role: member.role,
            student_learning_activity_id: studentActivity.id,
            // ใส่เงื่อนไขแบบเดียวกับ activity: LEADER เข้ากลุ่มเลย ลูกน้องต้องรอตอบรับ
            invite_token: member.role === "LEADER" ? null : inviteToken,
            token_expiry: member.role === "LEADER" ? null : tokenExpiry,
            status: member.role === "LEADER" ? "ACCEPT" : "PENDING",
          },
        });

        // 2.7 จัดเก็บข้อมูลสำหรับการส่งอีเมล
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

    // 3. ดึงชื่อกิจกรรมการเรียนรู้ เพื่อส่งไปในอีเมล (อยู่นอก Transaction)
    const learningActivity = await prisma.learning_activities.findUnique({
      where: { id: data.learning_activity_id },
      select: { learning_activity_name: true }, // สมมติว่าตารางนี้ใช้ฟิลด์ title (ถ้าใช้ชื่ออื่น เช่น name ให้เปลี่ยนด้วยครับ)
    });

    // 4. วนลูปส่งอีเมลให้สมาชิกที่เหลือ
    for (const mailData of emailsToSend) {
      try {
        await this.groupService.sendInviteEmail(
          mailData.email,
          inviterName,
          mailData.token,
          learningActivity?.learning_activity_name ?? "กิจกรรมการเรียนรู้", // ส่งชื่อกิจกรรมเข้าไป
          "learning-activity", // ระบุประเภทเพื่อให้รู้ว่าเชิญเข้า learning activity
        );
      } catch (err) {
        console.error(`ไม่สามารถส่งอีเมลหา ${mailData.email} ได้:`, err);
      }
    }

    return result;
  }

  async updateStudentLearningActivityGroup(
    data: UpdateStudentLearningActivityGroupBody,
  ) {
    const emailsToSend: { email: string; token: string; name: string }[] = [];
    let inviterName = "";

    const result = await prisma.$transaction(async (tx) => {
      const existingMembers =
        await tx.student_learning_activity_group_member.findMany({
          where: { group_id: data.group_id },
        });

      const group = await tx.student_learning_activity_group.update({
        where: { id: data.group_id },
        data: {
          student_learning_activity_group_member: {
            deleteMany: { group_id: data.group_id },
          },
        },
        select: { learning_activity_id: true },
      });

      for (const member of data.members) {
        let studentActivity = await tx.student_learning_activity.findFirst({
          where: {
            learning_activity_id: group.learning_activity_id,
            student_id: member.student_id,
          },
          select: { id: true },
        });

        if (!studentActivity) {
          studentActivity = await tx.student_learning_activity.create({
            data: {
              learning_activity_id: group.learning_activity_id,
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
          await tx.student_learning_activity_group_member.create({
            data: {
              group_id: data.group_id,
              student_id: member.student_id,
              role: member.role,
              student_learning_activity_id: studentActivity.id,
              invite_token: null,
              token_expiry: null,
              status: "ACCEPT",
            },
          });
          inviterName = `${userDetail.first_name_th} ${userDetail.last_name_th}`;
        } else if (oldMemberData) {
          await tx.student_learning_activity_group_member.create({
            data: {
              group_id: data.group_id,
              student_id: member.student_id,
              role: member.role,
              student_learning_activity_id: studentActivity.id,
              invite_token: oldMemberData.invite_token,
              token_expiry: oldMemberData.token_expiry,
              status: oldMemberData.status,
            },
          });
        } else {
          const inviteToken = crypto.randomBytes(32).toString("hex");
          const tokenExpiry = new Date();
          tokenExpiry.setDate(tokenExpiry.getDate() + 7);

          await tx.student_learning_activity_group_member.create({
            data: {
              group_id: data.group_id,
              student_id: member.student_id,
              role: member.role,
              student_learning_activity_id: studentActivity.id,
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

      return {
        group_id: data.group_id,
        learning_activity_id: group.learning_activity_id,
      };
    });

    const learningActivity = await prisma.learning_activities.findUnique({
      where: { id: result.learning_activity_id },
      select: { learning_activity_name: true },
    });

    for (const mailData of emailsToSend) {
      try {
        await this.groupService.sendInviteEmail(
          mailData.email,
          inviterName,
          mailData.token,
          learningActivity?.learning_activity_name ?? "",
          "learning-activity",
        );
      } catch (err) {
        console.error(`ไม่สามารถส่งอีเมลหา ${mailData.email} ได้:`, err);
      }
    }

    return { group_id: result.group_id };
  }

  async getStudentsWithoutGroup(
    section_id: number,
    learning_activity_id: number,
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
        student_learning_activity_group_member: {
          none: {
            student_learning_activity: {
              learning_activity_id: learning_activity_id,
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

  async getStudentLearningActivityGroup(
    student_id: string,
    learning_activity_id: number,
  ): Promise<GetStudentLearningActivityGroupResp | null> {
    const group = await prisma.student_learning_activity_group.findFirst({
      where: {
        learning_activity_id,
        student_learning_activity_group_member: {
          some: {
            student_id,
          },
        },
      },
      select: {
        id: true,
        student_learning_activity_group_member: {
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

    const members: MemberDetailResp[] =
      group.student_learning_activity_group_member.map((member) => ({
        student_id: member.student_id,
        role: member.role,
        student_name: member.student.full_name_th ?? "",
        status: member.status,
      }));

    return {
      group_id: group.id,
      members: members,
    };
  }

  async getStudentLearningActivityGroupInSec(
    section_id: number,
    student_id: string,
  ): Promise<GetStudentLearningActivityGroupResp[]> {
    const groups = await prisma.student_learning_activity_group.findMany({
      where: {
        learning_activities: {
          section_id,
        },
        student_learning_activity_group_member: {
          some: {
            student_id,
          },
        },
      },
      select: {
        id: true,
        student_learning_activity_group_member: {
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
        group.student_learning_activity_group_member.map((m) => ({
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
