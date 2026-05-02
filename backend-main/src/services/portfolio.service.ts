import crypto from "crypto";
import prisma from "../config/prisma";
import {
  CreatePortfolioReqBody,
  UpdatePortfolioReqBody,
  PortfolioResp,
  PortfolioTemplateResp,
} from "../models/portfolio.model";

import {
  Prisma,
  portfolio,
  portfolio_template,
  portfolio_skill_mapping,
} from "@prisma/client";

import UserService from "./user.service";
import PortfolioPersonalService from "./portfolio-personal.service";
import PortfolioEducationService from "./portfolio-education.service";
import PortfolioTrainingService from "./portfolio-training.service";
import PortfolioCertificateService from "./portfolio-certificate.service";
import PortfolioInternshipService from "./portfolio-internship.service";
import PortfolioAwardService from "./portfolio-award.service";
import PortfolioActivityService from "./portfolio-activity.service";
import PortfolioSkillService from "./portfolio-skill.service";
import PortfolioThesisService from "./portfolio-thesis.service";
import StudentService from "./student.service";
import StudentActivityService from "./student-activity.service";

type PortfolioWithRelations = portfolio & {
  portfolio_template?: portfolio_template | null;
  portfolio_skill_mapping?: portfolio_skill_mapping[];
};

const mapToPortfolioResp = (p: PortfolioWithRelations): PortfolioResp => ({
  id: p.id,
  userId: p.user_id,
  templateId: p.template_id,
  portfolioName: p.portfolio_name,
  templateColor: p.template_color,
  about_me: p.about_me,
  isShowPersonal: p.isShowPersonal ?? true,
  isShowEducation: p.isShowEducation ?? true,
  isShowTraining: p.isShowTraining ?? true,
  isShowCertificate: p.isShowCertificate ?? true,
  isShowSkill: p.isShowSkill ?? true,
  isShowIntern: p.isShowIntern ?? true,
  isShowThesis: p.isShowThesis ?? true,
  isShowAward: p.isShowAward ?? true,
  isShowActivity: p.isShowActivity ?? true,
  selectedSkillIds: p.portfolio_skill_mapping?.map((m) => m.skill_id) || [],
  templateName: p.portfolio_template?.name || null,
  publicShareToken: p.public_share_token,
  shareExpiresAt: p.share_expires_at,
});

export default class PortfolioService {
  private userService: UserService;
  private portfolioPersonalService: PortfolioPersonalService;
  private portfolioEducationService: PortfolioEducationService;
  private portfolioTrainingService: PortfolioTrainingService;
  private portfolioCertificateService: PortfolioCertificateService;
  private portfolioInternshipService: PortfolioInternshipService;
  private portfolioAwardService: PortfolioAwardService;
  private portfolioActivityService: PortfolioActivityService;
  private portfolioSkillService: PortfolioSkillService;
  private portfolioThesisService: PortfolioThesisService;
  private studentService: StudentService;
  private studentActivityService: StudentActivityService;

  constructor() {
    this.userService = new UserService();
    this.portfolioPersonalService = new PortfolioPersonalService();
    this.portfolioEducationService = new PortfolioEducationService();
    this.portfolioTrainingService = new PortfolioTrainingService();
    this.portfolioCertificateService = new PortfolioCertificateService();
    this.portfolioInternshipService = new PortfolioInternshipService();
    this.portfolioAwardService = new PortfolioAwardService();
    this.portfolioActivityService = new PortfolioActivityService();
    this.portfolioSkillService = new PortfolioSkillService();
    this.portfolioThesisService = new PortfolioThesisService();
    this.studentService = new StudentService();
    this.studentActivityService = new StudentActivityService();
  }
  async getAllPortfolios(userId: string): Promise<PortfolioResp[]> {
    const portfolios = await prisma.portfolio.findMany({
      where: { user_id: userId },
      include: {
        portfolio_template: true,
        portfolio_skill_mapping: true,
      },
      orderBy: { id: "asc" },
    });

    return portfolios.map(mapToPortfolioResp);
  }

  async getPortfolioById(id: string): Promise<PortfolioResp | null> {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        portfolio_template: true,
        portfolio_skill_mapping: true,
      },
    });

    if (!portfolio) return null;

    return mapToPortfolioResp(portfolio);
  }

  async getPublicPortfolioById(token: string): Promise<any> {
    const portfolioRecord = await prisma.portfolio.findFirst({
      where: { public_share_token: token },
      include: {
        portfolio_template: true,
        portfolio_skill_mapping: true,
      },
    });

    if (!portfolioRecord) return null;

    // Check expiration
    if (
      portfolioRecord.share_expires_at &&
      new Date() > new Date(portfolioRecord.share_expires_at)
    ) {
      const error = new Error("Link Expired");
      (error as any).status = 410;
      throw error;
    }

    const portfolioConfig = mapToPortfolioResp(portfolioRecord);

    const studentId = portfolioConfig.userId;

    const [
      userResponse,
      portfolioPersonalData,
      educationData,
      trainingData,
      certificateData,
      internshipData,
      awardData,
      activityData,
      skillsDataResp,
      thesisData,
    ] = await Promise.all([
      this.userService.getStudentDetail(studentId),
      this.portfolioPersonalService.getPortfolioPersonal(studentId),
      this.portfolioEducationService.getAllPortfolioEducation(studentId),
      this.portfolioTrainingService.getAllPortfolioTraining(studentId),
      this.portfolioCertificateService.getAllPortfolioCertificate(studentId),
      this.portfolioInternshipService.getAllPortfolioInternship(studentId),
      this.portfolioAwardService.getAllPortfolioAward(studentId),
      this.portfolioActivityService.getAllPortfolioActivity(studentId),
      this.portfolioSkillService.getAllPortfolioSkill(studentId),
      this.portfolioThesisService.getAllPortfolioThesis(studentId),
    ]);

    const userData = userResponse;
    const skillsData = skillsDataResp;

    // Fetch details for each skill mapping to build the "works" list
    const workDetailsPromises: any[] = [];
    const skillMap: Record<number, any> = {};

    for (const skill of skillsData) {
      if ((skill as any).mappings && (skill as any).mappings.length > 0) {
        for (const mapping of (skill as any).mappings) {
          skillMap[mapping.id] = skill;
          workDetailsPromises.push(
            Promise.all([
              this.studentService.getActivityDetailsByStudentActivityId(
                mapping.student_activity_id,
              ),
              this.studentActivityService.getStudentActivityAttachments(
                mapping.student_activity_id,
              ),
              Promise.resolve(mapping),
            ]),
          );
        }
      }
    }

    const workDetailsResults = await Promise.all(workDetailsPromises);
    const realWorksMap = new Map<string, any>();

    for (const [
      detailsRes,
      attachmentsRes,
      mappingItem,
    ] of workDetailsResults) {
      const mapping = mappingItem;
      if (detailsRes) {
        const activity = detailsRes;
        const skill = skillMap[mapping.id];
        const workId = String(mapping.student_activity_id);

        if (realWorksMap.has(workId)) {
          const existingWork = realWorksMap.get(workId);
          if (!existingWork.relatedSkillIds.includes(String(skill.id))) {
            existingWork.relatedSkillIds.push(String(skill.id));
          }
        } else {
          realWorksMap.set(workId, {
            id: workId,
            title: activity.activities?.activity_name || "ไม่มีชื่อชิ้นงาน",
            subtitle:
              activity.course?.course_name_en ||
              activity.course?.course_name_th ||
              "",
            subjectId: activity.activities?.section_id,
            repositoryUrl: mapping.repository,
            isShowRepo: mapping.isShowRepo,
            roleAndResp: mapping.role_and_resp,
            isShowRole: mapping.isShowRole,
            initialExpectation: mapping.init_expect,
            isShowExpectation: mapping.isShowInit,
            reflection: mapping.reflection,
            isShowReflection: mapping.isShowReflec,
            feedback: activity.feedback,
            relatedSkillIds: [String(skill.id)],
            attachments: (attachmentsRes || []).map((a: any) => ({
              id: a.attachment_id.toString(),
              fileName: a.original_filename,
              fileType: a.file_type || "file",
              url: a.url,
            })),
          });
        }
      }
    }

    const realWorks = Array.from(realWorksMap.values());

    return {
      portfolioConfig,
      userData,
      portfolioPersonalData,
      educationData,
      trainingData,
      certificateData,
      internshipData,
      awardData,
      activityData,
      skillsData,
      thesisData,
      realWorks,
    };
  }

  async createPortfolio(data: CreatePortfolioReqBody): Promise<PortfolioResp> {
    const {
      user_id,
      template_id,
      portfolio_name,
      template_color,
      about_me,
      selectedSkillIds = [],
      ...visibilityFlags
    } = data as CreatePortfolioReqBody & { template_name?: string };

    const result = await prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.create({
        data: {
          user_id,
          template_id,
          portfolio_name,
          template_color,
          about_me,
          ...visibilityFlags,
        },
      });

      if (selectedSkillIds.length > 0) {
        await tx.portfolio_skill_mapping.createMany({
          data: (selectedSkillIds as number[]).map((skill_id: number) => ({
            portfolio_id: portfolio.id,
            skill_id,
          })),
        });
      }

      return tx.portfolio.findUniqueOrThrow({
        where: { id: portfolio.id },
        include: {
          portfolio_template: true,
          portfolio_skill_mapping: true,
        },
      });
    });

    return mapToPortfolioResp(result);
  }

  async updatePortfolio(
    id: string,
    data: UpdatePortfolioReqBody,
  ): Promise<PortfolioResp> {
    const { selectedSkillIds, template_name, ...portfolioData } =
      data as UpdatePortfolioReqBody & { template_name?: string };

    const result = await prisma.$transaction(async (tx) => {
      // Update portfolio data
      await tx.portfolio.update({
        where: { id },
        data: portfolioData as Prisma.portfolioUpdateInput,
      });

      // Sync skills: Wipe and Rebuild
      if (selectedSkillIds !== undefined) {
        await tx.portfolio_skill_mapping.deleteMany({
          where: { portfolio_id: id },
        });

        if (selectedSkillIds.length > 0) {
          await tx.portfolio_skill_mapping.createMany({
            data: (selectedSkillIds as number[]).map((skill_id: number) => ({
              portfolio_id: id,
              skill_id,
            })),
          });
        }
      }

      return tx.portfolio.findUniqueOrThrow({
        where: { id },
        include: {
          portfolio_template: true,
          portfolio_skill_mapping: true,
        },
      });
    });

    return mapToPortfolioResp(result);
  }

  async deletePortfolio(id: string): Promise<void> {
    // Skills mapping will be deleted due to Cascade (if configured in DB)
    // Actually the prisma pull showed: onDelete: Cascade, onUpdate: NoAction, map: "fk_mapping_portfolio"
    // So it should be handled by DB
    await prisma.portfolio.delete({
      where: { id },
    });
  }

  async getAllTemplates(): Promise<PortfolioTemplateResp[]> {
    return prisma.portfolio_template.findMany({
      orderBy: { id: "asc" },
    });
  }

  async generateShareLink(
    id: string,
    expiresAt: string | null,
  ): Promise<PortfolioResp> {
    const shareExpiresAt = expiresAt ? new Date(expiresAt) : null;

    const result = await prisma.portfolio.update({
      where: { id },
      data: {
        public_share_token: crypto.randomUUID(),
        share_expires_at: shareExpiresAt,
      },
      include: {
        portfolio_template: true,
        portfolio_skill_mapping: true,
      },
    });

    return mapToPortfolioResp(result);
  }
}
