import crypto from "crypto";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import {
  CreatePortfolioReqBody,
  UpdatePortfolioReqBody,
  PortfolioResp,
  PortfolioTemplateResp,
} from "../models/portfolio.model";

import {
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
import PortfolioSkillService, {
  assertOwnSkills,
} from "./portfolio-skill.service";
import PortfolioThesisService from "./portfolio-thesis.service";
import StudentService from "./student.service";
import StudentActivityService from "./student-activity.service";

type PortfolioWithRelations = portfolio & {
  portfolio_template?: portfolio_template | null;
  portfolio_skill_mapping?: portfolio_skill_mapping[];
};

/**
 * One submission on the public page, with every skill that pointed at it.
 *
 * The names are the frontend's, not the database's: this shape is assembled
 * for the shared link and read straight by the template components, so it is
 * declared here rather than left to inference over a `Map<string, any>`.
 */
type PublicWork = {
  id: string;
  title: string;
  subtitle: string;
  subjectId: number | null;
  repositoryUrl: string | null;
  isShowRepo: boolean | null;
  roleAndResp: string | null;
  isShowRole: boolean | null;
  initialExpectation: string | null;
  isShowExpectation: boolean | null;
  reflection: string | null;
  isShowReflection: boolean | null;
  feedback: string | null;
  relatedSkillIds: string[];
  attachments: {
    id: string;
    fileName: string | null;
    fileType: string;
    url: string | null;
  }[];
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

  async getPublicPortfolioById(token: string) {
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
      throw new HttpError(410, "ลิงก์นี้หมดอายุแล้ว");
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

    // Fetch details for each skill mapping to build the "works" list. The
    // mapping is carried alongside what was looked up for it, so the skill it
    // came from is still in hand below — it used to be parked in a lookup
    // keyed by mapping id and read back out.
    const workDetails = await Promise.all(
      skillsData.flatMap((skill) =>
        // No `?? []` any more: every endpoint that answers a skill answers
        // `mappings` too, empty list and all, and `PortfolioSkillDetail` says
        // so since #68. The guard was reading an optional the type invented.
        skill.mappings.map(async (mapping) => {
          const [activity, attachments] = await Promise.all([
            this.studentService.getActivityDetailsByStudentActivityId(
              mapping.student_activity_id,
            ),
            this.studentActivityService.getStudentActivityAttachments(
              mapping.student_activity_id,
            ),
          ]);

          return { skill, mapping, activity, attachments };
        }),
      ),
    );

    const realWorksMap = new Map<string, PublicWork>();

    for (const { skill, mapping, activity, attachments } of workDetails) {
      if (!activity) continue;

      const workId = String(mapping.student_activity_id);
      const existingWork = realWorksMap.get(workId);

      if (existingWork) {
        if (!existingWork.relatedSkillIds.includes(String(skill.id))) {
          existingWork.relatedSkillIds.push(String(skill.id));
        }
        continue;
      }

      // The subject is only looked up for an activity that sits in a section;
      // for one that does not, the lookup answers with the submission row on
      // its own and there is no course to name.
      const course = "course" in activity ? activity.course : null;

      realWorksMap.set(workId, {
        id: workId,
        title: activity.activities?.activity_name || "ไม่มีชื่อชิ้นงาน",
        subtitle: course?.course_name_en || course?.course_name_th || "",
        subjectId: activity.activities?.section_id ?? null,
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
        attachments: attachments.map((a) => ({
          id: a.attachment_id.toString(),
          fileName: a.original_filename,
          // Always "file". The attachments carry a file_type column, but the
          // query behind them does not select it, so this has read undefined
          // since it was written. Left alone rather than widened: the column
          // holds the extension in capitals ("PDF"), not one of the five words
          // the template matches on, and the same query answers
          // /student-activity/attachments. Pinned in BEHAVIOR-CHANGES.md — the
          // page is unaffected because it works the type out from the filename
          // itself.
          fileType: "file",
          url: a.url,
        })),
      });
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

  async createPortfolio(
    user_id: string,
    data: CreatePortfolioReqBody,
  ): Promise<PortfolioResp> {
    const {
      template_id,
      portfolio_name,
      template_color,
      about_me,
      selectedSkillIds = [],
      ...visibilityFlags
    } = data;

    const result = await prisma.$transaction(async (tx) => {
      const skillIds = await assertOwnSkills(tx, user_id, selectedSkillIds);

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

      if (skillIds.length > 0) {
        await tx.portfolio_skill_mapping.createMany({
          data: skillIds.map((skill_id) => ({
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
    const { selectedSkillIds, ...portfolioData } = data;

    const result = await prisma.$transaction(async (tx) => {
      // Update portfolio data
      const updated = await tx.portfolio.update({
        where: { id },
        data: portfolioData,
      });

      // Sync skills: Wipe and Rebuild
      if (selectedSkillIds !== undefined) {
        const skillIds = await assertOwnSkills(
          tx,
          updated.user_id,
          selectedSkillIds,
        );

        await tx.portfolio_skill_mapping.deleteMany({
          where: { portfolio_id: id },
        });

        if (skillIds.length > 0) {
          await tx.portfolio_skill_mapping.createMany({
            data: skillIds.map((skill_id) => ({
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
    expiresAt: Date | null,
  ): Promise<PortfolioResp> {
    const result = await prisma.portfolio.update({
      where: { id },
      data: {
        public_share_token: crypto.randomUUID(),
        share_expires_at: expiresAt,
      },
      include: {
        portfolio_template: true,
        portfolio_skill_mapping: true,
      },
    });

    return mapToPortfolioResp(result);
  }
}
