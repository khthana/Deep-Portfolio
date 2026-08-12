import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import {
  AssignWorkToSkillsReqBody,
  CreatePortfolioSkillReqBody,
  SkillMappingReqBody,
  UpdatePortfolioSkillReqBody,
  PortfolioSkillResp,
  PortfolioWorkResp,
} from "../models/portfolio-skill.model";

/**
 * A student may only tie their own skills to something — to a piece of work
 * here, to a cover page in portfolio.service.ts.
 *
 * Skill ids arrive in the body, and an id says nothing about whose it is, so
 * this is the one ownership question the middleware cannot answer: the row
 * being written belongs to the caller either way, and it is the ids inside it
 * that may not. Runs inside the caller's transaction, so there is no window
 * between the check and the write (#31).
 *
 * Hands back the ids with duplicates removed, which is what the caller should
 * write: naming the same skill twice is one tie, not two.
 */
export async function assertOwnSkills(
  tx: Prisma.TransactionClient,
  userId: string,
  skillIds: number[],
): Promise<number[]> {
  const wanted = [...new Set(skillIds)];

  const owned = await tx.portfolio_skill.findMany({
    where: { id: { in: wanted }, user_id: userId },
    select: { id: true },
  });

  if (owned.length !== wanted.length) {
    // A refusal, not a fault. Without a status the error handler reports this
    // as a 500, which tells the caller the server broke when in fact it
    // declined. Same shape as the expired share link in portfolio.service.ts.
    throw new HttpError(403, "มีทักษะบางรายการที่ไม่ใช่ของผู้ใช้รายนี้");
  }

  return wanted;
}

/**
 * The other half of the same question: a mapping names a submission as well as
 * a skill, and the id arrives in the body just as the skill's does (#47).
 *
 * Two refusals, because they are two different mistakes. An id that names
 * nothing is a value inside the row being written that cannot be resolved —
 * 400, the answer ADR-0012 §2 gives score_ratio_id, not the 404 ADR-0009 gives
 * a submission that is itself the row being written to. An id that names
 * somebody else's submission resolves fine and is refused on permission — 403,
 * and it is a refusal worth making: /works reads the feedback off every
 * submission the caller's mappings point at, so a mapping onto a stranger's
 * work would put their teacher's words on this student's page.
 *
 * The foreign key added alongside this check says the same thing at the
 * database, but only the first half of it, and only as an error the caller
 * cannot read.
 * See docs/adr/0020-mapping-names-own-submission.md.
 */
export async function assertOwnSubmissions(
  tx: Prisma.TransactionClient,
  userId: string,
  submissionIds: number[],
): Promise<void> {
  const wanted = [...new Set(submissionIds)];
  if (wanted.length === 0) return;

  const found = await tx.student_activity.findMany({
    where: { id: { in: wanted } },
    select: { student_id: true },
  });

  if (found.length !== wanted.length) {
    throw new HttpError(400, "ไม่พบชิ้นงานที่เลือก");
  }

  if (found.some((submission) => submission.student_id !== userId)) {
    throw new HttpError(403, "มีชิ้นงานบางรายการที่ไม่ใช่ของผู้ใช้รายนี้");
  }
}

const mapToMappingData = (skillId: number, m: SkillMappingReqBody) => ({
  skill_id: skillId,
  student_activity_id: m.student_activity_id,
  repository: m.repository ?? null,
  role_and_resp: m.role_and_resp ?? null,
  init_expect: m.init_expect ?? null,
  reflection: m.reflection ?? null,
  isShowRepo: m.isShowRepo ?? false,
  isShowRole: m.isShowRole ?? false,
  isShowInit: m.isShowInit ?? false,
  isShowReflec: m.isShowReflec ?? false,
});

export default class PortfolioSkillService {
  async getPortfolioWorks(userId: string): Promise<PortfolioWorkResp[]> {
    // Fetch all mapping rows owned by this user, including parent skill info
    const mappings = await prisma.portfolio_skill_activity_mapping.findMany({
      where: {
        portfolio_skill: { user_id: userId },
      },
      include: {
        portfolio_skill: { select: { id: true, name: true } },
      },
      orderBy: { student_activity_id: "asc" },
    });

    // Fetch feedbacks for all associated student_activities
    const studentActivityIds = [
      ...new Set(mappings.map((m) => m.student_activity_id)),
    ];
    const activitiesWithFeedback = await prisma.student_activity.findMany({
      where: { id: { in: studentActivityIds } },
      select: { id: true, feedback: true },
    });
    const feedbackMap = new Map<number, string | null>(
      activitiesWithFeedback.map((a) => [a.id, a.feedback]),
    );

    // Group by student_activity_id — metadata is shared, skills accumulate
    const grouped = new Map<number, PortfolioWorkResp>();

    for (const row of mappings) {
      const aid = row.student_activity_id;
      if (!grouped.has(aid)) {
        grouped.set(aid, {
          student_activity_id: aid,
          mapping_ids: [],
          skills: [],
          repository: row.repository,
          role_and_resp: row.role_and_resp,
          init_expect: row.init_expect,
          reflection: row.reflection,
          isShowRepo: row.isShowRepo ?? false,
          isShowRole: row.isShowRole ?? false,
          isShowInit: row.isShowInit ?? false,
          isShowReflec: row.isShowReflec ?? false,
          feedback: feedbackMap.get(aid) ?? null,
        });
      }
      const work = grouped.get(aid)!;
      work.mapping_ids.push(row.id);
      work.skills.push({
        id: row.portfolio_skill.id,
        name: row.portfolio_skill.name,
      });
    }

    return Array.from(grouped.values());
  }

  async getAllPortfolioSkill(userId: string): Promise<PortfolioSkillResp[]> {
    const skills = await prisma.portfolio_skill.findMany({
      where: { user_id: userId },
      include: {
        portfolio_skill_activity_mapping: true,
      },
      orderBy: { id: "asc" },
    });

    return skills.map((skill) => ({
      id: skill.id,
      user_id: skill.user_id,
      name: skill.name,
      mappings: skill.portfolio_skill_activity_mapping,
    }));
  }

  async getPortfolioSkillById(id: number): Promise<PortfolioSkillResp | null> {
    const skill = await prisma.portfolio_skill.findUnique({
      where: { id },
      include: {
        portfolio_skill_activity_mapping: true,
      },
    });

    if (!skill) return null;

    return {
      id: skill.id,
      user_id: skill.user_id,
      name: skill.name,
      mappings: skill.portfolio_skill_activity_mapping,
    };
  }

  async createPortfolioSkill(
    userId: string,
    data: CreatePortfolioSkillReqBody,
  ): Promise<PortfolioSkillResp> {
    const { name, mappings = [] } = data;

    const result = await prisma.$transaction(async (tx) => {
      // Before the skill row, not between it and the mappings: the transaction
      // would take it back either way, but ADR-0012 §2 asks first, and a rule
      // followed only where it happens not to matter is not being followed.
      await assertOwnSubmissions(
        tx,
        userId,
        mappings.map((m) => m.student_activity_id),
      );

      const skill = await tx.portfolio_skill.create({
        data: {
          user_id: userId,
          name,
        },
      });

      if (mappings.length > 0) {
        await tx.portfolio_skill_activity_mapping.createMany({
          data: mappings.map((m) => mapToMappingData(skill.id, m)),
        });
      }

      return tx.portfolio_skill.findUniqueOrThrow({
        where: { id: skill.id },
        include: {
          portfolio_skill_activity_mapping: true,
        },
      });
    });

    return {
      id: result.id,
      user_id: result.user_id,
      name: result.name,
      mappings: result.portfolio_skill_activity_mapping,
    };
  }

  async updatePortfolioSkill(
    userId: string,
    id: number,
    data: UpdatePortfolioSkillReqBody,
  ): Promise<PortfolioSkillResp> {
    const { name, mappings } = data;

    const result = await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.portfolio_skill.update({
          where: { id },
          data: { name },
        });
      }

      if (mappings !== undefined) {
        // The replacement is a delete followed by a write, and both are inside
        // this transaction, so the mappings the skill already has survive a
        // refusal wherever it is raised. Asking first only saves the work.
        await assertOwnSubmissions(
          tx,
          userId,
          mappings.map((m) => m.student_activity_id),
        );

        await tx.portfolio_skill_activity_mapping.deleteMany({
          where: { skill_id: id },
        });

        if (mappings.length > 0) {
          await tx.portfolio_skill_activity_mapping.createMany({
            data: mappings.map((m) => mapToMappingData(id, m)),
          });
        }
      }

      return tx.portfolio_skill.findUniqueOrThrow({
        where: { id },
        include: { portfolio_skill_activity_mapping: true },
      });
    });

    return {
      id: result.id,
      user_id: result.user_id,
      name: result.name,
      mappings: result.portfolio_skill_activity_mapping,
    };
  }

  async deletePortfolioSkill(id: number): Promise<PortfolioSkillResp> {
    const skill = await prisma.portfolio_skill.delete({
      where: { id },
    });

    return {
      id: skill.id,
      user_id: skill.user_id,
      name: skill.name,
      mappings: [],
    };
  }

  async getPortfolioSkillMappingById(id: number) {
    return prisma.portfolio_skill_activity_mapping.findUnique({
      where: { id },
      include: {
        portfolio_skill: true,
      },
    });
  }

  async deleteSkillMapping(id: number): Promise<void> {
    await prisma.portfolio_skill_activity_mapping.delete({ where: { id } });
  }

  async assignWorkToSkills(
    user_id: string,
    data: AssignWorkToSkillsReqBody,
  ): Promise<void> {
    const {
      student_activity_id,
      skill_ids,
      repository,
      role_and_resp,
      init_expect,
      reflection,
      isShowRepo = false,
      isShowRole = false,
      isShowInit = false,
      isShowReflec = false,
    } = data;

    await prisma.$transaction(async (tx) => {
      const skillIds = await assertOwnSkills(tx, user_id, skill_ids);
      await assertOwnSubmissions(tx, user_id, [student_activity_id]);

      await tx.portfolio_skill_activity_mapping.deleteMany({
        where: {
          student_activity_id,
          portfolio_skill: { user_id },
        },
      });

      // Create new mappings
      if (skillIds.length > 0) {
        await tx.portfolio_skill_activity_mapping.createMany({
          data: skillIds.map((skill_id) => ({
            skill_id,
            student_activity_id,
            repository: repository ?? null,
            role_and_resp: role_and_resp ?? null,
            init_expect: init_expect ?? null,
            reflection: reflection ?? null,
            isShowRepo,
            isShowRole,
            isShowInit,
            isShowReflec,
          })),
        });
      }
    });
  }
}
