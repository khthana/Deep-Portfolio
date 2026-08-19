import prisma from "../../src/config/prisma";
import {
  createActivity,
  createLearningActivity,
  submittedAtFor,
} from "./activity";
import { createStudent } from "./user";

/**
 * Groups, for the two kinds of work students hand in together.
 *
 * The shape is the same on both sides and is worth stating once: a group has
 * exactly one LEADER, who is the student who made it and is ACCEPT from the
 * start, and any number of MEMBERs, who are PENDING until they follow the link
 * in their invite email. Every member row points at that student's own
 * submission row through a unique foreign key, so a group cannot be assembled
 * without one submission per member — the factory creates them.
 *
 * Invite tokens are the only reason a member row differs from a leader row
 * beyond the label, and they are what POST /group/accept-invite is given. A
 * case about invites should say what it wants the token and its expiry to be.
 *
 * `status` belongs to the group and to every member's submission row at once:
 * handing in writes both in one transaction, and so does grading. A case that
 * wants a group that has handed something in says so once, here.
 */

export interface GroupMemberOptions {
  /** student.student_id. A student is created if this is left out. */
  student_id?: string;
  /** The first member defaults to LEADER and the rest to MEMBER, which is the
   *  only arrangement the endpoints produce. */
  role?: "LEADER" | "MEMBER";
  /** Defaults to ACCEPT for a leader and PENDING for a member — how the group
   *  looks the moment it is created, before anyone has answered. */
  status?: "PENDING" | "ACCEPT" | "REJECTED";
  /** Left out, a member gets a token and a leader gets none. Pass a string to
   *  make it findable: the accept-invite endpoint takes the token, not an id. */
  invite_token?: string | null;
  /** Defaults to seven days out, matching the endpoint. A case about an
   *  expired invite passes a date in the past. */
  token_expiry?: Date | null;
}

export interface ActivityGroupOptions {
  /** activities.id. An activity is created if this is left out. */
  activity_id?: number;
  /** One entry per member, leader first. Two students — a leader and one
   *  invited member — if the case does not say. */
  members?: GroupMemberOptions[];
  /** The group's own status, which its members' submission rows take too. */
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADING" | "GRADED";
  /** What the marking wrote on every member's submission row. The teacher's
   *  roster reads all three off the first accepted member. */
  score?: number;
  feedback?: string;
  remark?: string;
}

export async function createActivityGroup(options: ActivityGroupOptions = {}) {
  const activity_id = options.activity_id ?? (await createActivity()).id;
  const members = options.members ?? [{}, {}];
  const status = options.status ?? "NOT_SUBMITTED";

  const group = await prisma.student_activity_group.create({
    data: { activity_id, status },
  });

  for (const [index, member] of members.entries()) {
    const student_id = member.student_id ?? (await createStudent()).student_id;
    const role = member.role ?? (index === 0 ? "LEADER" : "MEMBER");

    const submission = await prisma.student_activity.create({
      data: {
        activity_id,
        student_id,
        status,
        submitted_at: submittedAtFor(status),
        score: options.score,
        feedback: options.feedback,
        remark: options.remark,
      },
    });

    await prisma.student_activity_group_member.create({
      data: {
        group_id: group.id,
        student_id,
        role,
        student_activity_id: submission.id,
        status: member.status ?? (role === "LEADER" ? "ACCEPT" : "PENDING"),
        ...tokenFor(role, member),
      },
    });
  }

  return prisma.student_activity_group.findUniqueOrThrow({
    where: { id: group.id },
    include: { student_activity_group_member: { orderBy: { id: "asc" } } },
  });
}

export interface LearningActivityGroupOptions {
  /** learning_activities.id. One is created if this is left out. */
  learning_activity_id?: number;
  members?: GroupMemberOptions[];
  /** The group's own status, which its members' submission rows take too. */
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADING" | "GRADED";
  /** What the marking wrote on every member's submission row. No score here —
   *  classroom work is not marked out of anything. */
  feedback?: string;
  remark?: string;
}

export async function createLearningActivityGroup(
  options: LearningActivityGroupOptions = {},
) {
  const learning_activity_id =
    options.learning_activity_id ?? (await createLearningActivity()).id;
  const members = options.members ?? [{}, {}];
  const status = options.status ?? "NOT_SUBMITTED";

  const group = await prisma.student_learning_activity_group.create({
    data: { learning_activity_id, status },
  });

  for (const [index, member] of members.entries()) {
    const student_id = member.student_id ?? (await createStudent()).student_id;
    const role = member.role ?? (index === 0 ? "LEADER" : "MEMBER");

    const submission = await prisma.student_learning_activity.create({
      data: {
        learning_activity_id,
        student_id,
        status,
        submitted_at: submittedAtFor(status),
        feedback: options.feedback,
        remark: options.remark,
      },
    });

    await prisma.student_learning_activity_group_member.create({
      data: {
        group_id: group.id,
        student_id,
        role,
        student_learning_activity_id: submission.id,
        status: member.status ?? (role === "LEADER" ? "ACCEPT" : "PENDING"),
        ...tokenFor(role, member),
      },
    });
  }

  return prisma.student_learning_activity_group.findUniqueOrThrow({
    where: { id: group.id },
    include: {
      student_learning_activity_group_member: { orderBy: { id: "asc" } },
    },
  });
}

/** A leader has nothing to accept, so the endpoints leave both columns null on
 *  that row; everyone else gets a token good for a week. */
function tokenFor(role: "LEADER" | "MEMBER", member: GroupMemberOptions) {
  if (role === "LEADER" && member.invite_token === undefined) {
    return { invite_token: null, token_expiry: null };
  }

  const inWeek = new Date();
  inWeek.setDate(inWeek.getDate() + 7);

  return {
    invite_token: member.invite_token ?? nextInviteToken(),
    token_expiry:
      member.token_expiry === undefined ? inWeek : member.token_expiry,
  };
}

let inviteTokens = 0;

/** Unique but readable, unlike the 32 random bytes the endpoint mints — a
 *  failing case is easier to follow when the token says which one it is. */
function nextInviteToken(): string {
  inviteTokens += 1;
  return `invite-token-${inviteTokens}`;
}
