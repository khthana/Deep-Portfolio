import prisma from "../config/prisma";
import crypto from "crypto";
import { transporter } from "../config/mailer";

export default class GroupService {
  async sendInviteEmail(
    emailToInvite: string,
    inviterName: string,
    inviteToken: string,
    activityName: string,
    type: "learning-activity" | "activity",
  ) {
    const inviteLink = `${process.env.CLIENT_URL}/group/accept-invite?token=${inviteToken}&type=${type}`;

    const mailOptions = {
      from: `DEEP Portfolio <${process.env.EMAIL_USER}>`,
      to: emailToInvite,
      subject: `คำเชิญให้เข้าร่วมกลุ่ม`,
      html: `
      <p>สวัสดี,</p>
      <p>คุณได้รับคำเชิญจาก ${inviterName} เพื่อเข้าร่วมกลุ่มในกิจกรรม "${activityName}"</p>
      <p>โปรดคลิกที่ลิงก์ด้านล่างเพื่อตอบรับคำเชิญ:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>ลิงก์นี้จะหมดอายุใน 7 วัน</p>
      <p>ขอบคุณ</p>
    `,
    };

    await transporter.sendMail(mailOptions);
  }

  async acceptInvite(
    token: string,
    action: "ACCEPT" | "REJECTED",
    type: "learning-activity" | "activity",
  ) {
    const member =
      type === "activity"
        ? await prisma.student_activity_group_member.findFirst({
            where: { invite_token: token, token_expiry: { gte: new Date() } },
          })
        : await prisma.student_learning_activity_group_member.findFirst({
            where: { invite_token: token, token_expiry: { gte: new Date() } },
          });

    if (!member) {
      throw new Error("โทเค็นคำเชิญไม่ถูกต้องหรือหมดอายุแล้ว");
    }

    return type === "activity"
      ? await prisma.student_activity_group_member.update({
          where: { id: member.id },
          data: { status: action },
        })
      : await prisma.student_learning_activity_group_member.update({
          where: { id: member.id },
          data: { status: action },
        });
  }

  async validateInvite(token: string, type: "learning-activity" | "activity") {
    const invite =
      type === "activity"
        ? await prisma.student_activity_group_member.findFirst({
            where: { invite_token: token, token_expiry: { gte: new Date() } },
          })
        : await prisma.student_learning_activity_group_member.findFirst({
            where: { invite_token: token, token_expiry: { gte: new Date() } },
          });

    if (!invite) {
      throw new Error("โทเค็นคำเชิญไม่ถูกต้องหรือหมดอายุแล้ว");
    }

    return { status: invite.status };
  }
}
