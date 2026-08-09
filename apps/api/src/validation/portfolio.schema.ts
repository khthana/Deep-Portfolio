import { z } from "zod";
import {
  blankableText,
  id,
  optionalBool,
  optionalDate,
  optionalId,
  userId,
  uuid,
} from "./fields";

/**
 * `/portfolio` — the cover page — and the pieces the nine section routers share.
 *
 * Two things about this group show up in every schema here and in the three
 * files beside it. Nothing on it is behind any middleware, so the user being
 * acted for is a field like any other and has to be checked like one — #31 is
 * the missing middleware, not this. And most of it is posted as multipart,
 * because the sections carry uploads, so every field arrives as a string, which
 * is what the coercing types in ./fields are for.
 */

/** Whose portfolio the request is about. Every list in the group asks this way. */
export const portfolioOwnerQuery = z.object({ user_id: userId });

/** The nine section tables key on an autoincrement integer. */
export const portfolioEntryParams = z.object({ id });

/**
 * The portfolio itself keys on a uuid, and its share link is a second one.
 *
 * Postgres refuses to compare a uuid column against text that is not a uuid, so
 * an id of the wrong shape never reached the lookup: it came back as a 500
 * about a failing query rather than a 400 about the id. That is the note pinned
 * in portfolio.test.ts, and it is this ticket's to clear.
 */
export const portfolioParams = z.object({ id: uuid });
export const shareTokenParams = z.object({ token: uuid });

/**
 * The attachment join rows an update asks to drop.
 *
 * A JSON caller sends a list. A multipart caller sends the field once per id,
 * which multer collects into a list of its own — except for a single id, where
 * it stays a bare string. Both become a list here, which is what every service
 * in the group was doing for itself with `Array.isArray(…) ? … : […]`.
 */
export const idsToDelete = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  return Array.isArray(value) ? value : [value];
}, z.array(id).optional());

/** Which sections the cover page shows. Every one of them defaults to true. */
const visibility = {
  isShowPersonal: optionalBool,
  isShowEducation: optionalBool,
  isShowTraining: optionalBool,
  isShowCertificate: optionalBool,
  isShowSkill: optionalBool,
  isShowIntern: optionalBool,
  isShowThesis: optionalBool,
  isShowAward: optionalBool,
  isShowActivity: optionalBool,
};

/**
 * What the cover page holds, apart from who owns it.
 *
 * The text is `blankableText` rather than `optionalText` throughout: a student
 * who deletes everything in the "about me" box means the box to be empty, not
 * to be left as it was.
 */
const cover = {
  template_id: optionalId,
  portfolio_name: blankableText.optional(),
  template_color: blankableText.optional(),
  about_me: blankableText.optional(),

  /**
   * Which of the student's skills to put on this portfolio. An empty list is a
   * real instruction — take them all off — which is why the service asks
   * whether the field was sent rather than whether it has anything in it.
   */
  selectedSkillIds: z.array(id).optional(),

  ...visibility,
};

export const createPortfolioBody = z.object({ user_id: userId, ...cover });
export const updatePortfolioBody = z.object(cover);

/**
 * Issuing a share link. `expiresAt` absent is a real choice and not an
 * oversight: a link with no expiry is one that never stops working, which is
 * what the button does when the student does not pick a date.
 */
export const generateShareLinkBody = z.object({ expiresAt: optionalDate });

export type CreatePortfolioFields = z.infer<typeof createPortfolioBody>;
export type UpdatePortfolioFields = z.infer<typeof updatePortfolioBody>;
