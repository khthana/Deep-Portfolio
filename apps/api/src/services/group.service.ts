import type { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { transporter } from "../config/mailer";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

/**
 * A token that names no invitation, or one whose seven days have run out. Both
 * are the caller's, so both carry their own status: the message is written for
 * the person holding the link, and a 500 would keep it from them now that the
 * error middleware forwards only what a status says was deliberate.
 */
const INVALID_INVITE = () =>
  new HttpError(400, "โทเค็นคำเชิญไม่ถูกต้องหรือหมดอายุแล้ว");

/**
 * Everybody a group names must be enrolled in the section the work belongs to
 * (#37, docs/adr/0007-group-membership.md).
 *
 * Both writes on both routers rewrite the whole membership from the request, so
 * this is the one question that has to be asked of the list rather than of the
 * caller — and it is asked of every entry including the leader's, which is what
 * keeps a student outside the class from forming a group inside it.
 *
 * `400` rather than the `403` the middlewares above answer, for the reason
 * `assertOwnRubric` gives: what is refused is not the caller's right to act but
 * a value inside a list they sent, and the caller can fix it by sending a
 * different list. A student id that belongs to no student at all falls in here
 * too — nobody is enrolled under it — which is a foreign-key 500 turned into a
 * sentence, and it does not tell the caller whether the id exists.
 *
 * Takes the transaction client and is called inside it, before the first write,
 * for the same reason ADR-0001 gives for the skill-id checks: the list is
 * checked and acted on without a gap in between, and a refusal leaves no
 * submission rows behind for work that was never grouped.
 *
 * A section of `null` — work that belongs to no section, which `activities`
 * allows and nothing writes — has no roster, so nobody passes. Same sentence
 * again: which of the two went wrong is not something the refusal should say.
 */
export async function assertMembersEnrolled(
  tx: Prisma.TransactionClient,
  section_id: number | null,
  members: { student_id: string }[],
): Promise<void> {
  const enrolled =
    section_id === null
      ? []
      : await tx.student_course.findMany({
          where: {
            section_id,
            student_id: { in: members.map((member) => member.student_id) },
          },
          select: { student_id: true },
        });

  const roster = new Set(enrolled.map((row) => row.student_id));

  if (members.some((member) => !roster.has(member.student_id))) {
    throw new HttpError(400, "รายชื่อมีนักศึกษาที่ไม่ได้ลงทะเบียนกลุ่มเรียนนี้");
  }
}

export default class GroupService {
  async sendInviteEmail(
    emailToInvite: string,
    inviterName: string,
    inviteToken: string,
    activityName: string,
    type: "learning-activity" | "activity",
  ) {
    // No account configured means no mail can be sent, so don't open a
    // connection to find that out. env.ts already treats EMAIL_USER as
    // optional and the callers already treat a failure to send as survivable;
    // without this, every group created on a deployment with no mail account
    // waits out an SMTP handshake per invited member before returning.
    if (!env.EMAIL_USER) return;

    const inviteLink = `${env.CLIENT_URL}/group/accept-invite?token=${inviteToken}&type=${type}`;

    const mailOptions = {
      from: `DEEP Portfolio <${env.EMAIL_USER}>`,
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
      throw INVALID_INVITE();
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
      throw INVALID_INVITE();
    }

    return { status: invite.status };
  }
}
