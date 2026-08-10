import { z } from "zod";
import {
  blankableText,
  clearableDate,
  clearableDecimal,
  clearableInteger,
  optionalBool,
  optionalText,
  text,
} from "./fields";
import { idsToDelete } from "./portfolio.schema";

/**
 * The seven list-shaped sections of the e-Portfolio: prizes, certificates,
 * activities, training, projects, schooling and placements.
 *
 * They are all the same endpoint five times over — list by user, read one,
 * create, update, delete — so what is worth reading here is where they differ,
 * which is only ever their columns and which of those the table insists on.
 *
 * Three conventions run through the file. Free text is `blankableText`, because
 * a student who empties a description means it empty rather than unchanged; the
 * exception is the handful of NOT NULL columns, where a blank field is the
 * browser saying nothing rather than the student asking for an empty name, and
 * `optionalText` reads it that way. Dates and numbers are `clearable*` for the
 * same reason — these forms post every input they have, so an empty one is the
 * student taking a value out, which is what the services used to read as "leave
 * it alone". And `is_show*` is `optionalBool` rather than the string
 * comparisons the controllers were doing by hand: "true" and "false" still mean
 * what they meant, and anything else is now a 400 instead of quietly counting
 * as false.
 */

/** Every update but education's may drop attachments while it is at it. */
const attachments = { ids_to_delete: idsToDelete };

// --- Prizes -----------------------------------------------------------------

const award = {
  organize: blankableText.optional(),
  name: blankableText.optional(),
  award: blankableText.optional(),
  date: clearableDate,
  description: blankableText.optional(),
  is_show: optionalBool,
};

export const createPortfolioAwardBody = z.object({ ...award });
export const updatePortfolioAwardBody = z.object({ ...award, ...attachments });

// --- Certificates -----------------------------------------------------------

const certificate = {
  date: clearableDate,
  organize: blankableText.optional(),
  name: blankableText.optional(),
  description: blankableText.optional(),
  is_show: optionalBool,
};

export const createPortfolioCertificateBody = z.object({
  ...certificate,
});
export const updatePortfolioCertificateBody = z.object({
  ...certificate,
  ...attachments,
});

// --- Activities -------------------------------------------------------------

/** `name` is NOT NULL: an activity with nothing to call it is not one. */
const activity = {
  date: clearableDate,
  role: blankableText.optional(),
  description: blankableText.optional(),
  is_show: optionalBool,
};

export const createPortfolioActivityBody = z.object({
  name: text,
  ...activity,
});
export const updatePortfolioActivityBody = z.object({
  name: optionalText,
  ...activity,
  ...attachments,
});

// --- Training ---------------------------------------------------------------

const training = {
  year: clearableInteger,
  country: blankableText.optional(),
  organize: blankableText.optional(),
  name: blankableText.optional(),
  description: blankableText.optional(),
  is_show: optionalBool,
};

export const createPortfolioTrainingBody = z.object({ ...training });
export const updatePortfolioTrainingBody = z.object({
  ...training,
  ...attachments,
});

// --- Projects ---------------------------------------------------------------

/** One flag per free-text field: the student chooses which of the four to show. */
const thesis = {
  name: blankableText.optional(),
  repository: blankableText.optional(),
  role_and_resp: blankableText.optional(),
  init_expect: blankableText.optional(),
  reflection: blankableText.optional(),
  is_show_repo: optionalBool,
  is_show_role: optionalBool,
  is_show_init: optionalBool,
  is_show_reflec: optionalBool,
};

export const createPortfolioThesisBody = z.object({ ...thesis });
export const updatePortfolioThesisBody = z.object({
  ...thesis,
  ...attachments,
});

// --- Schooling --------------------------------------------------------------

/**
 * The one section with no attachments, so no `ids_to_delete`, and the one whose
 * required column is a level rather than a name. `gpa` is a Decimal(3, 2) and
 * so is the only fractional number in the group.
 */
const education = {
  institution: blankableText.optional(),
  start_year: clearableInteger,
  end_year: clearableInteger,
  country: blankableText.optional(),
  gpa: clearableDecimal,
  study_plan: blankableText.optional(),
  faculty: blankableText.optional(),
  major: blankableText.optional(),
  is_show: optionalBool,
};

export const createPortfolioEducationBody = z.object({
  education_level: text,
  ...education,
});
export const updatePortfolioEducationBody = z.object({
  education_level: optionalText,
  ...education,
});

// --- Placements -------------------------------------------------------------

/**
 * `type` tells an internship from a co-op placement. It is NOT NULL and free
 * text — the frontend sends "internship" and "coop" in lower case, and the
 * column has never been anything but those two, but making it an enum here
 * would refuse rows the table already holds. That belongs with the master data
 * work, not with validating the request.
 */
const internship = {
  title: blankableText.optional(),
  position: blankableText.optional(),
  company: blankableText.optional(),
  country: blankableText.optional(),
  province: blankableText.optional(),
  start_date: clearableDate,
  end_date: clearableDate,
  resp: blankableText.optional(),
  is_show_resp: optionalBool,
  learning_out: blankableText.optional(),
  is_show_learning: optionalBool,
  reflection: blankableText.optional(),
  is_show_reflec: optionalBool,
};

export const createPortfolioInternshipBody = z.object({
  type: text,
  ...internship,
});
export const updatePortfolioInternshipBody = z.object({
  type: optionalText,
  ...internship,
  ...attachments,
});

export type CreatePortfolioAwardFields = z.infer<
  typeof createPortfolioAwardBody
>;
export type UpdatePortfolioAwardFields = z.infer<
  typeof updatePortfolioAwardBody
>;
export type CreatePortfolioCertificateFields = z.infer<
  typeof createPortfolioCertificateBody
>;
export type UpdatePortfolioCertificateFields = z.infer<
  typeof updatePortfolioCertificateBody
>;
export type CreatePortfolioActivityFields = z.infer<
  typeof createPortfolioActivityBody
>;
export type UpdatePortfolioActivityFields = z.infer<
  typeof updatePortfolioActivityBody
>;
export type CreatePortfolioTrainingFields = z.infer<
  typeof createPortfolioTrainingBody
>;
export type UpdatePortfolioTrainingFields = z.infer<
  typeof updatePortfolioTrainingBody
>;
export type CreatePortfolioThesisFields = z.infer<
  typeof createPortfolioThesisBody
>;
export type UpdatePortfolioThesisFields = z.infer<
  typeof updatePortfolioThesisBody
>;
export type CreatePortfolioEducationFields = z.infer<
  typeof createPortfolioEducationBody
>;
export type UpdatePortfolioEducationFields = z.infer<
  typeof updatePortfolioEducationBody
>;
export type CreatePortfolioInternshipFields = z.infer<
  typeof createPortfolioInternshipBody
>;
export type UpdatePortfolioInternshipFields = z.infer<
  typeof updatePortfolioInternshipBody
>;
