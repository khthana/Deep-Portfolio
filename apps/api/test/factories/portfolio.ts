import prisma from "../../src/config/prisma";
import { createStudent } from "./user";

/**
 * The e-Portfolio — a student's own record of who they are and what they have
 * done, kept in one table per kind of thing: personal details, education,
 * training, certificates, and so on.
 *
 * Two shapes recur across all of them and are worth knowing before reading any
 * of these factories:
 *
 * - Every row hangs off users.user_id, and the endpoints take that id from the
 *   query or the body rather than from the session. So a case is nearly always
 *   about *whose* row it is, which is why `user_id` is the first option
 *   everywhere and why every factory that is not given one invents a student
 *   rather than borrowing one.
 * - Attachments are a join table away (portfolio_training_attachments,
 *   portfolio_certificate_attachments), never a column. `attachment_ids` here
 *   writes those join rows from attachments the case made with
 *   createFileAttachment / createLinkAttachment.
 *
 * Nothing here uploads anything. A case that wants an object in the bucket has
 * to post to the endpoint that puts one there.
 */

/** users.user_id for a student made on the spot, when the case does not care
 *  whose portfolio it is. */
async function someStudent(): Promise<string> {
  return (await createStudent()).student_id;
}

export interface PortfolioTemplateOptions {
  name?: string;
}

/**
 * A layout a portfolio can be built on. Nothing seeds these — the baseline
 * holds only what an institution would have configured, and templates are
 * application data — so a case that wants one has to say so.
 */
export function createPortfolioTemplate(
  options: PortfolioTemplateOptions = {},
) {
  return prisma.portfolio_template.create({
    data: { name: options.name ?? "แม่แบบตัวอย่าง" },
  });
}

export interface PortfolioSkillOptions {
  user_id?: string;
  name?: string;
}

/** A skill a student claims. A portfolio points at a subset of them through
 *  portfolio_skill_mapping, which is what `skill_ids` below writes. */
export async function createPortfolioSkill(
  options: PortfolioSkillOptions = {},
) {
  return prisma.portfolio_skill.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      name: options.name ?? "การเขียนโปรแกรม",
    },
  });
}

export interface PortfolioOptions {
  user_id?: string;
  template_id?: number;
  portfolio_name?: string;
  template_color?: string;
  about_me?: string;
  /** portfolio_skill.id values. Written as portfolio_skill_mapping rows, which
   *  is where the endpoint reads selectedSkillIds back from. */
  skill_ids?: number[];
  /**
   * The column has a gen_random_uuid() default, so every portfolio is already
   * shareable the moment it is created — pass this only when the case needs to
   * know the token in advance.
   */
  public_share_token?: string;
  /** When the share link stops working. null, the default, means never. */
  share_expires_at?: Date | null;
  isShowPersonal?: boolean;
  isShowEducation?: boolean;
  isShowTraining?: boolean;
  isShowCertificate?: boolean;
}

export async function createPortfolio(options: PortfolioOptions = {}) {
  const portfolio = await prisma.portfolio.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      template_id: options.template_id,
      portfolio_name: options.portfolio_name ?? "แฟ้มสะสมผลงานตัวอย่าง",
      template_color: options.template_color,
      about_me: options.about_me,
      public_share_token: options.public_share_token,
      share_expires_at: options.share_expires_at,
      isShowPersonal: options.isShowPersonal,
      isShowEducation: options.isShowEducation,
      isShowTraining: options.isShowTraining,
      isShowCertificate: options.isShowCertificate,
    },
  });

  if (options.skill_ids?.length) {
    await prisma.portfolio_skill_mapping.createMany({
      data: options.skill_ids.map((skill_id) => ({
        portfolio_id: portfolio.id,
        skill_id,
      })),
    });
  }

  return portfolio;
}

export interface PortfolioPersonalOptions {
  user_id?: string;
  date_of_birth?: Date;
  nationality?: string;
  race?: string;
  github?: string;
  linkedin?: string;
  /** Left unset by default, because the read endpoint falls back to
   *  users.email when it is null and several cases are about that fallback. */
  email?: string | null;
  phone_number?: string | null;
  attachment_id?: number;
}

/** One row per user — user_id is the primary key, not just a foreign key, so
 *  a user cannot have two of these. */
export async function createPortfolioPersonal(
  options: PortfolioPersonalOptions = {},
) {
  return prisma.portfolio_personal.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      date_of_birth: options.date_of_birth,
      nationality: options.nationality ?? "ไทย",
      race: options.race,
      github: options.github,
      linkedin: options.linkedin,
      email: options.email,
      phone_number: options.phone_number,
      attachment_id: options.attachment_id,
    },
  });
}

export interface PortfolioEducationOptions {
  user_id?: string;
  /** The only NOT NULL column in the portfolio group apart from the ids, which
   *  is why it has a default here and why POST without it is a 500. */
  education_level?: string;
  institution?: string;
  /** What the list is ordered by, descending. */
  start_year?: number;
  end_year?: number;
  country?: string;
  /** Decimal(3,2) in the column; the API converts it back to a number on the
   *  way out. */
  gpa?: number;
  study_plan?: string;
  faculty?: string;
  major?: string;
  is_show?: boolean;
}

export async function createPortfolioEducation(
  options: PortfolioEducationOptions = {},
) {
  return prisma.portfolio_education.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      education_level: options.education_level ?? "ปริญญาตรี",
      institution: options.institution ?? "สถาบันตัวอย่าง",
      start_year: options.start_year,
      end_year: options.end_year,
      country: options.country,
      gpa: options.gpa,
      study_plan: options.study_plan,
      faculty: options.faculty,
      major: options.major,
      is_show: options.is_show,
    },
  });
}

export interface PortfolioTrainingOptions {
  user_id?: string;
  /** What the list is ordered by, descending. */
  year?: number;
  country?: string;
  organize?: string;
  name?: string;
  description?: string;
  is_show?: boolean;
  /** attachments.attachment_id values, joined on through
   *  portfolio_training_attachments. */
  attachment_ids?: number[];
}

export async function createPortfolioTraining(
  options: PortfolioTrainingOptions = {},
) {
  const training = await prisma.portfolio_training.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      year: options.year,
      country: options.country,
      organize: options.organize ?? "หน่วยงานตัวอย่าง",
      name: options.name ?? "อบรมตัวอย่าง",
      description: options.description,
      is_show: options.is_show,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.portfolio_training_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        training_id: training.id,
        attachment_id,
      })),
    });
  }

  return training;
}

export interface PortfolioCertificateOptions {
  user_id?: string;
  /** A date column, so the time of day is dropped. What the list is ordered
   *  by, descending. */
  date?: Date;
  organize?: string;
  name?: string;
  description?: string;
  is_show?: boolean;
  /** attachments.attachment_id values, joined on through
   *  portfolio_certificate_attachments. */
  attachment_ids?: number[];
}

export async function createPortfolioCertificate(
  options: PortfolioCertificateOptions = {},
) {
  const certificate = await prisma.portfolio_certificate.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      date: options.date,
      organize: options.organize ?? "หน่วยงานตัวอย่าง",
      name: options.name ?? "ประกาศนียบัตรตัวอย่าง",
      description: options.description,
      is_show: options.is_show,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.portfolio_certificate_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        certificate_id: certificate.id,
        attachment_id,
      })),
    });
  }

  return certificate;
}
