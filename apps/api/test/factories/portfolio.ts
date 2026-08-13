import prisma from "../../src/config/prisma";
import { createStudent } from "./user";
import { createSubmission } from "./activity";

/**
 * The e-Portfolio — a student's own record of who they are and what they have
 * done, kept in one table per kind of thing: personal details, education,
 * training, certificates, and so on.
 *
 * Two shapes recur across all of them and are worth knowing before reading any
 * of these factories:
 *
 * - Every row hangs off users.user_id, and since #31 the endpoints take that id
 *   from the session — so a case is nearly always about *whose* row it is, and
 *   the id these factories return is the one its cookie has to be signed for.
 *   That is why `user_id` is the first option everywhere, and why every factory
 *   that is not given one invents a student rather than borrowing one: two rows
 *   made without it belong to two different people.
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

export interface PortfolioInternshipOptions {
  user_id?: string;
  /** NOT NULL, VarChar(20) — the one required column here, which is why a POST
   *  that omits it is a 500. The frontend sends "internship" or "coop". */
  type?: string;
  title?: string;
  position?: string;
  company?: string;
  country?: string;
  province?: string;
  /** What the list is ordered by, descending. */
  start_date?: Date;
  end_date?: Date;
  resp?: string;
  is_show_resp?: boolean;
  learning_out?: string;
  is_show_learning?: boolean;
  reflection?: string;
  is_show_reflec?: boolean;
  /** attachments.attachment_id values, joined on through
   *  portfolio_internship_attachments. */
  attachment_ids?: number[];
}

export async function createPortfolioInternship(
  options: PortfolioInternshipOptions = {},
) {
  const internship = await prisma.portfolio_internship.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      type: options.type ?? "internship",
      title: options.title ?? "ฝึกงานตัวอย่าง",
      position: options.position,
      company: options.company ?? "บริษัทตัวอย่าง",
      country: options.country,
      province: options.province,
      start_date: options.start_date,
      end_date: options.end_date,
      resp: options.resp,
      is_show_resp: options.is_show_resp,
      learning_out: options.learning_out,
      is_show_learning: options.is_show_learning,
      reflection: options.reflection,
      is_show_reflec: options.is_show_reflec,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.portfolio_internship_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        internship_id: internship.id,
        attachment_id,
      })),
    });
  }

  return internship;
}

export interface PortfolioAwardOptions {
  user_id?: string;
  organize?: string;
  name?: string;
  /** The prize itself — "รางวัลชนะเลิศ" — where `name` is what it was for. */
  award?: string;
  /** A date column, so the time of day is dropped. What the list is ordered
   *  by, descending. */
  date?: Date;
  description?: string;
  is_show?: boolean;
  /** attachments.attachment_id values, joined on through
   *  portfolio_award_attachments. */
  attachment_ids?: number[];
}

export async function createPortfolioAward(
  options: PortfolioAwardOptions = {},
) {
  const award = await prisma.portfolio_award.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      organize: options.organize ?? "หน่วยงานตัวอย่าง",
      name: options.name ?? "การแข่งขันตัวอย่าง",
      award: options.award ?? "รางวัลชนะเลิศ",
      date: options.date,
      description: options.description,
      is_show: options.is_show,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.portfolio_award_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        award_id: award.id,
        attachment_id,
      })),
    });
  }

  return award;
}

export interface PortfolioThesisOptions {
  user_id?: string;
  name?: string;
  repository?: string;
  role_and_resp?: string;
  init_expect?: string;
  reflection?: string;
  is_show_repo?: boolean;
  is_show_role?: boolean;
  is_show_init?: boolean;
  is_show_reflec?: boolean;
  /** attachments.attachment_id values, joined on through
   *  portfolio_thesis_attachments. */
  attachment_ids?: number[];
}

/** The final-year project. Has no date column of any kind, which is why its
 *  list is ordered by id and newest simply means most recently written. */
export async function createPortfolioThesis(
  options: PortfolioThesisOptions = {},
) {
  const thesis = await prisma.portfolio_thesis.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      name: options.name ?? "ปริญญานิพนธ์ตัวอย่าง",
      repository: options.repository,
      role_and_resp: options.role_and_resp,
      init_expect: options.init_expect,
      reflection: options.reflection,
      is_show_repo: options.is_show_repo,
      is_show_role: options.is_show_role,
      is_show_init: options.is_show_init,
      is_show_reflec: options.is_show_reflec,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.portfolio_thesis_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        thesis_id: thesis.id,
        attachment_id,
      })),
    });
  }

  return thesis;
}

export interface PortfolioActivityOptions {
  user_id?: string;
  /** NOT NULL — the one required column here, which is why a POST that omits
   *  it is a 500. */
  name?: string;
  /** A date column, so the time of day is dropped. What the list is ordered
   *  by, descending. */
  date?: Date;
  role?: string;
  description?: string;
  is_show?: boolean;
  /** attachments.attachment_id values, joined on through
   *  portfolio_activity_attachments. */
  attachment_ids?: number[];
}

/**
 * Something the student took part in outside their coursework — a camp, a club,
 * volunteering. Not to be confused with `activities`, the work a teacher sets,
 * which `createActivity` makes.
 */
export async function createPortfolioActivity(
  options: PortfolioActivityOptions = {},
) {
  const activity = await prisma.portfolio_activities.create({
    data: {
      user_id: options.user_id ?? (await someStudent()),
      name: options.name ?? "กิจกรรมตัวอย่าง",
      date: options.date,
      role: options.role,
      description: options.description,
      is_show: options.is_show,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.portfolio_activity_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        activity_id: activity.id,
        attachment_id,
      })),
    });
  }

  return activity;
}

export interface PortfolioSkillActivityMappingOptions {
  /** portfolio_skill.id. A skill is created if this is left out. */
  skill_id?: number;
  /**
   * student_activity.id — a piece of submitted coursework the student is
   * pointing at as evidence of the skill. There is **no foreign key** on this
   * column, so a mapping can name a submission that does not exist; the works
   * endpoint simply finds no feedback for it.
   */
  student_activity_id?: number;
  repository?: string;
  role_and_resp?: string;
  init_expect?: string;
  reflection?: string;
  isShowRepo?: boolean;
  isShowRole?: boolean;
  isShowInit?: boolean;
  isShowReflec?: boolean;
}

/** Ties a skill to a piece of submitted work. The same submission usually has
 *  one of these per skill it demonstrates, and the works endpoint groups them
 *  back together by student_activity_id.
 *
 *  Not portfolio_skill_mapping, which is a different table joining a portfolio
 *  to the skills it shows — that one is written by `skill_ids` on
 *  createPortfolio. */
export async function createPortfolioSkillActivityMapping(
  options: PortfolioSkillActivityMappingOptions = {},
) {
  return prisma.portfolio_skill_activity_mapping.create({
    data: {
      skill_id: options.skill_id ?? (await createPortfolioSkill()).id,
      student_activity_id:
        options.student_activity_id ?? (await createSubmission()).id,
      repository: options.repository,
      role_and_resp: options.role_and_resp,
      init_expect: options.init_expect,
      reflection: options.reflection,
      isShowRepo: options.isShowRepo,
      isShowRole: options.isShowRole,
      isShowInit: options.isShowInit,
      isShowReflec: options.isShowReflec,
    },
  });
}
