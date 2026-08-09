import { z } from "zod";
import { optionalDate, optionalId, userId } from "./fields";

/**
 * `/portfolio-personal` — the details at the top of the portfolio: date of
 * birth, nationality, the two links, the contact pair, and the profile picture.
 *
 * One row per student, keyed on the student, which is why the path parameter is
 * a user id and not a row id. What makes it worth a file of its own is that it
 * is the only section a student edits by clearing fields rather than by
 * deleting rows, so an empty field here is an instruction and not a shrug —
 * the opposite of every other section in the group.
 */

/**
 * The two spellings of "the student cleared this".
 *
 * The form posts every input it has, filled in or not, so a field the student
 * emptied arrives as `""` — or, where the frontend has already turned a `null`
 * into a string on its way into the multipart body, as the four letters
 * n-u-l-l. Both mean the column should be set back to NULL, and neither can be
 * left to Prisma, which would store `""` as an empty string and `"null"` as a
 * nationality.
 *
 * This used to be a loop in the service over the keys of an `any`, which is why
 * it applied the same rule to `attachment_id` and `date_of_birth` as to the
 * text. Here each column keeps its own type, and the clearing is the only thing
 * they share.
 */
function clearable<S extends z.ZodType>(schema: S) {
  return z.preprocess(
    (value) => (value === "null" || value === "" ? null : value),
    schema.nullable(),
  );
}

/**
 * The same, for the two fields where an empty string is kept as one.
 *
 * The read endpoint falls back to the address and telephone on the student's
 * account whenever these columns are NULL, so clearing them to NULL would undo
 * itself on the next read. An empty string is how the student says "not this
 * one" in a way the fallback will not argue with.
 */
function clearableContact<S extends z.ZodType>(schema: S) {
  return z.preprocess(
    (value) => (value === "null" ? null : value),
    schema.nullable(),
  );
}

const optionalString = z.string().optional();

const personal = {
  date_of_birth: clearable(optionalDate),
  nationality: clearable(optionalString),
  race: clearable(optionalString),
  github: clearable(optionalString),
  linkedin: clearable(optionalString),
  email: clearableContact(optionalString),
  phone_number: clearableContact(optionalString),

  /**
   * The profile picture, when the caller points at an attachment that already
   * exists rather than uploading one. An upload wins: the controller hands the
   * file to the attachments service and the id it comes back with replaces
   * whatever this said.
   */
  attachment_id: clearable(optionalId),
};

/** Whose details — the path parameter on read, update, delete and upsert. */
export const portfolioPersonalParams = z.object({ user_id: userId });

/** Create is the one that names the student in the body instead. */
export const createPortfolioPersonalBody = z.object({
  user_id: userId,
  ...personal,
});

export const portfolioPersonalBody = z.object(personal);

export type PortfolioPersonalFields = z.infer<typeof portfolioPersonalBody>;
