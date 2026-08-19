import type {
  Prisma,
  student_activity_group_member_status,
} from "@prisma/client";
import crypto from "crypto";
import prisma from "../config/prisma";
import { transporter } from "../config/mailer";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";
import type { ValidateInviteResp } from "@deep-portfolio/api-types";

/**
 * A token that names no invitation, or one whose seven days have run out. Both
 * are the caller's, so both carry their own status: the message is written for
 * the person holding the link, and a 500 would keep it from them now that the
 * error middleware forwards only what a status says was deliberate.
 */
const INVALID_INVITE = () =>
  new HttpError(400, "โทเค็นคำเชิญไม่ถูกต้องหรือหมดอายุแล้ว");

/**
 * A fresh invitation: 32 random bytes, good for seven days.
 *
 * Both writes on both group routers minted this inline — four copies of the
 * same three lines, all of which had to agree about the week — and #57 adds a
 * fifth caller that has to agree with them too. The number lives here now, and
 * `sendInviteEmail` tells the invited student the same one.
 */
export function mintInvite(): { invite_token: string; token_expiry: Date } {
  const token_expiry = new Date();
  token_expiry.setDate(token_expiry.getDate() + 7);

  return {
    invite_token: crypto.randomBytes(32).toString("hex"),
    token_expiry,
  };
}

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
    throw new HttpError(
      400,
      "รายชื่อมีนักศึกษาที่ไม่ได้ลงทะเบียนกลุ่มเรียนนี้",
    );
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

  async validateInvite(
    token: string,
    type: "learning-activity" | "activity",
  ): Promise<ValidateInviteResp> {
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

  /**
   * Invites one member again, on a token good for another seven days (#57).
   *
   * Until this existed there was no way to make a new token at all. A member row
   * holds exactly one, `PATCH` copies whatever is there forward rather than
   * re-issuing, and `acceptInvite` refuses an expired one — so a student who let
   * the week run out stayed PENDING behind a link that could never work again,
   * and the group could neither carry them nor be told why.
   *
   * That single column is also why nothing is said here about cancelling the old
   * link: writing the new one is cancelling it, and keeping both alive at once
   * would take a table of invitations rather than a column on the member.
   *
   * Only for a member who has not answered. ACCEPT has nothing to invite and
   * REJECTED has answered — asking a student again after they said no is a
   * decision for whoever runs the course, and this endpoint will not make it
   * quietly. Who may ask is the leader and nobody else, which is
   * `requireGroupLeader` on the route (ADR-0004); who the invitation says it is
   * from is the session, not the row.
   *
   * A failed send is logged and not raised, as on the two writes that send the
   * first invitation. The row is already written by then, so throwing would
   * report a token that had in fact been replaced — the leader would be told the
   * invitation failed and the old link would be dead anyway. Trying again is
   * safe and costs nothing but another token.
   */
  async resendInvite(
    group_id: number,
    student_id: string,
    inviter_id: string,
    type: "learning-activity" | "activity",
  ) {
    const invitation = await findInvitation(group_id, student_id, type);

    if (!invitation) {
      throw new HttpError(404, "ไม่พบสมาชิกคนนี้ในกลุ่ม");
    }

    if (invitation.status !== "PENDING") {
      throw new HttpError(
        400,
        "ส่งคำเชิญซ้ำได้เฉพาะสมาชิกที่ยังไม่ตอบรับคำเชิญ",
      );
    }

    const invite = mintInvite();

    if (type === "activity") {
      await prisma.student_activity_group_member.update({
        where: { id: invitation.id },
        data: invite,
      });
    } else {
      await prisma.student_learning_activity_group_member.update({
        where: { id: invitation.id },
        data: invite,
      });
    }

    // Both rows have to exist: `student` keys on `users`, and the member row
    // keys on `student`, so a group with a member in it cannot name either of
    // these ids at somebody who is not there.
    const invited = await prisma.users.findUniqueOrThrow({
      where: { user_id: student_id },
      select: { email: true },
    });
    const inviter = await prisma.users.findUniqueOrThrow({
      where: { user_id: inviter_id },
      select: { first_name_th: true, last_name_th: true },
    });

    try {
      await this.sendInviteEmail(
        invited.email,
        `${inviter.first_name_th} ${inviter.last_name_th}`,
        invite.invite_token,
        invitation.work_name,
        type,
      );
    } catch (err) {
      console.error(`ไม่สามารถส่งอีเมลหา ${invited.email} ได้:`, err);
    }
  }
}

/** One member's invitation, and the name of the work their group is for — the
 *  two sides say all of it differently and none of it matters past here. */
interface Invitation {
  id: number;
  status: student_activity_group_member_status;
  work_name: string;
}

/**
 * Where the read of `resendInvite` learns which pair of tables it is in.
 *
 * Written as a lookup that answers in the same shape either way rather than as
 * a branch around the whole method: the refusals, the new token and the email
 * are the same work on both sides, and the two are worth reading as one thing.
 * The write is the one other place that has to know, and it stays inline —
 * folding it in here too would take a helper that picks a Prisma delegate, and
 * the two delegates only unify with a cast.
 */
async function findInvitation(
  group_id: number,
  student_id: string,
  type: "learning-activity" | "activity",
): Promise<Invitation | null> {
  if (type === "activity") {
    const member = await prisma.student_activity_group_member.findUnique({
      where: { group_id_student_id: { group_id, student_id } },
      select: {
        id: true,
        status: true,
        student_activity_group: {
          select: { activities: { select: { activity_name: true } } },
        },
      },
    });

    return (
      member && {
        id: member.id,
        status: member.status,
        work_name: member.student_activity_group.activities.activity_name,
      }
    );
  }

  const member = await prisma.student_learning_activity_group_member.findUnique(
    {
      where: { group_id_student_id: { group_id, student_id } },
      select: {
        id: true,
        status: true,
        student_learning_activity_group: {
          select: {
            learning_activities: { select: { learning_activity_name: true } },
          },
        },
      },
    },
  );

  return (
    member && {
      id: member.id,
      status: member.status,
      work_name:
        member.student_learning_activity_group.learning_activities
          .learning_activity_name,
    }
  );
}
