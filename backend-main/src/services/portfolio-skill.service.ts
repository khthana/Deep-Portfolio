import prisma from "../config/prisma";
import {
  AssignWorkToSkillsReqBody,
  CreatePortfolioSkillReqBody,
  UpdatePortfolioSkillReqBody,
  PortfolioSkillResp,
  PortfolioWorkResp,
} from "../models/portfolio-skill.model";

const mapToMappingData = (skillId: number, m: any) => ({
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

  async assignWorkToSkills(data: AssignWorkToSkillsReqBody): Promise<void> {
    const {
      user_id,
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

    if (!skill_ids || skill_ids.length === 0) {
      throw new Error("At least one skill_id is required");
    }

    await prisma.$transaction(async (tx) => {
      // Verify all skills belong to this user
      const ownedSkills = await tx.portfolio_skill.findMany({
        where: { id: { in: skill_ids }, user_id },
        select: { id: true },
      });

      if (ownedSkills.length !== skill_ids.length) {
        throw new Error("One or more skills do not belong to this user");
      }

      await tx.portfolio_skill_activity_mapping.deleteMany({
        where: {
          student_activity_id,
          portfolio_skill: { user_id },
        },
      });

      // Create new mappings
      if (skill_ids.length > 0) {
        await tx.portfolio_skill_activity_mapping.createMany({
          data: skill_ids.map((skill_id) => ({
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
