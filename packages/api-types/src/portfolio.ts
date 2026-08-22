import type { PortfolioActivityDetail } from "./portfolio-activity";
import type { PortfolioAwardDetail } from "./portfolio-award";
import type { PortfolioCertificateDetail } from "./portfolio-certificate";
import type { PortfolioEducationDetail } from "./portfolio-education";
import type { PortfolioInternshipDetail } from "./portfolio-internship";
import type { PortfolioPersonalDetail } from "./portfolio-personal";
import type { PortfolioSkillDetail } from "./portfolio-skill";
import type { PortfolioThesisDetail } from "./portfolio-thesis";
import type { PortfolioTrainingDetail } from "./portfolio-training";
import type { StudentDetail } from "./student";

/**
 * The cover page, and the one read that gathers every section behind it.
 *
 * The tenth and last of the e-Portfolio's routers (ADR-0040). It has nine
 * endpoints. Eight are the portfolio's own — a row of `portfolio` saying which
 * sections to show, which template to draw them in and which skills to put on
 * the front — and the ninth, `GET /portfolio/public/:token`, is the aggregate:
 * it calls all nine section services and answers everything at once, to a
 * caller who has the share link and no session at all.
 *
 * That is why this file comes last and is the one that imports the most: the
 * nine section files, and `student.ts` for the leaf the aggregate embeds as
 * `userData`. Every section it gathers had to have a name before the gathering
 * could be named.
 *
 * - `GET /portfolio`, `GET /portfolio/:id`, `POST`, `PUT`, `PATCH` and
 *   `POST /portfolio/:id/generate-share-link` all answer `PortfolioDetail`.
 * - `GET /portfolio/templates` answers `PortfolioTemplateDetail[]`.
 * - `GET /portfolio/public/:token` answers `PublicPortfolioDetail`.
 * - `DELETE /portfolio/:id` answers `data: null` and has no type here.
 */

/**
 * One row of `portfolio` — which sections a cover page shows and how.
 *
 * The field names are the API's own rather than the columns': `user_id`
 * becomes `userId`, `template_id` becomes `templateId`, and so on down. Not
 * `about_me`, which stays as the column spells it. Both are what the wire
 * says, so both are what this says (ADR-0037, ADR-0042 §3).
 *
 * Four fields are nullable because nothing on the way in makes them otherwise:
 * `createPortfolioBody` has `template_id`, `portfolio_name`, `template_color`
 * and `about_me` all optional, and the columns behind them all take null. The
 * web wrote every one of them as a plain `string` (#68), which is why the
 * screens that read them each carry a `??` of their own.
 *
 * The nine `isShowX` flags are not nullable, though their columns are: the
 * service coalesces each to the column's own default of `true` before
 * answering. Same table, same file, opposite answer to the four above — which
 * is the difference between a column that is nullable and a response that is.
 *
 * `templateName`, `publicShareToken` and `shareExpiresAt` were all optional on
 * the API's own copy, and none of them is: one mapping function builds every
 * response here and it sets all three every time. That makes four features in
 * a row where an optional key turned out never to be absent (ADR-0043 §2).
 */
export type PortfolioDetail = {
  id: string;
  userId: string;
  templateId: number | null;
  portfolioName: string | null;
  templateColor: string | null;
  about_me: string | null;
  isShowPersonal: boolean;
  isShowEducation: boolean;
  isShowTraining: boolean;
  isShowCertificate: boolean;
  isShowSkill: boolean;
  isShowIntern: boolean;
  isShowThesis: boolean;
  isShowAward: boolean;
  isShowActivity: boolean;
  selectedSkillIds: number[];
  /** The template's name, or null where the portfolio names no template. */
  templateName: string | null;
  /**
   * The share link's credential. Nullable because the column is, though a row
   * created through the API always has one: `public_share_token` defaults to a
   * fresh uuid, so a portfolio is shareable from the moment it exists and the
   * share button re-mints rather than mints.
   */
  publicShareToken: string | null;
  /** ISO 8601, or null for a link that never stops working. */
  shareExpiresAt: string | null;
};

/**
 * `GET /portfolio/templates` — the templates a cover page can be drawn in.
 *
 * The whole table: it has two columns and both are here. Master data, so there
 * is no write path in the API for it (see docs/importer.md).
 */
export type PortfolioTemplateDetail = {
  id: number;
  name: string;
};

/**
 * One file or link shown against a submission on the public page.
 *
 * Built from the same five columns `PortfolioSectionAttachment` carries, but
 * not the same shape: the aggregate assembles this list for the template
 * components rather than passing the section shape through, so it renames
 * `original_filename` to `fileName`, drops `file_path` and `file_size`, and
 * adds a `fileType` that no column feeds.
 *
 * `fileType` is the constant `"file"`, which is why it is typed as one. The
 * attachments carry a `file_type` column, but the query behind them does not
 * select it, so this field has never told a caller anything — it read
 * `undefined` before it was written out as a literal. Pinned in
 * BEHAVIOR-CHANGES.md rather than fixed: the column holds the extension in
 * capitals ("PDF"), not one of the five words the screens match on. The web
 * works the type out from `fileName` instead — since the aggregate pass, which
 * found it reading a key this endpoint has never sent, so every image on a
 * shared portfolio's work page had been drawing as a file (ADR-0043).
 */
export type PublicPortfolioWorkAttachment = {
  id: string;
  fileName: string;
  fileType: "file";
  url: string;
};

/**
 * One submission on the public page, with every skill that cited it.
 *
 * Keyed by `student_activity_id` — two skills pointing at the same submission
 * make one entry with two ids in `relatedSkillIds`, and the long-form answers
 * are the first one's. `PortfolioWorkDetail` is the same grouping done for the
 * student's own screen; this is the same rows again, renamed for the template
 * and carrying the submission's title, course and attachments as well.
 *
 * The four flags stay nullable here where `PortfolioWorkDetail` coalesces
 * them: this read hands the mapping's columns over as Prisma read them.
 *
 * `subtitle` is the course's English name, falling back to its Thai one and
 * then to the empty string — a submission that sits in no section has no
 * course to name.
 */
export type PublicPortfolioWork = {
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
  attachments: PublicPortfolioWorkAttachment[];
};

/**
 * `GET /portfolio/public/:token` — the whole portfolio, to a caller with the
 * link and nothing else.
 *
 * Twelve keys, ten of which are another feature's answer unchanged. The two
 * that are this endpoint's own are `portfolioConfig`, which is the cover page,
 * and `realWorks`, which is assembled here and nowhere else.
 *
 * `userData` and `portfolioPersonalData` are nullable for the same reason:
 * both are looked up by the portfolio owner's id, and either can come back
 * empty — a student who has filled in no personal details has no
 * `portfolio_personal` row, and the `student` row itself is missing for an
 * owner who is not a student. The other nine answer a list, empty and all.
 *
 * The key names are the API's, not the sections': `educationData`,
 * `trainingData`, and so on. They are what the two hooks that read this
 * destructure by, so renaming them is a change to what a caller sees rather
 * than a tidy-up (ADR-0043 §4).
 */
export type PublicPortfolioDetail = {
  portfolioConfig: PortfolioDetail;
  userData: StudentDetail | null;
  portfolioPersonalData: PortfolioPersonalDetail | null;
  educationData: PortfolioEducationDetail[];
  trainingData: PortfolioTrainingDetail[];
  certificateData: PortfolioCertificateDetail[];
  internshipData: PortfolioInternshipDetail[];
  awardData: PortfolioAwardDetail[];
  activityData: PortfolioActivityDetail[];
  skillsData: PortfolioSkillDetail[];
  thesisData: PortfolioThesisDetail[];
  realWorks: PublicPortfolioWork[];
};
