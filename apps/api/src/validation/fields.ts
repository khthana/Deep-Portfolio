import { z } from "zod";

/**
 * The field types this API actually receives, as opposed to the ones Zod ships.
 *
 * Two things make the difference. Query strings, route parameters and multipart
 * form fields are all strings — `?section_id=12` is `"12"` — so a schema built
 * from `z.number()` would reject every real request. And a field that is
 * present but empty (`?section_id=`, or a form field the browser sent blank)
 * means the same thing as one that was left out, which is not how Zod reads it.
 *
 * Both are handled by preprocessing rather than by `z.coerce`, which gets the
 * first case right and the second one wrong: `Number("")` is `0`, so
 * `z.coerce.number()` turns an empty parameter into a real section id.
 *
 * The `optional*` variants exist as their own exports rather than as
 * `.optional()` on the required ones for the same reason. `.optional()` wraps
 * the outside of the schema, so it tests the raw `""` — which is not undefined
 * — and then hands `""` to preprocessing anyway. Putting the optionality inside
 * the pipe is what makes an empty field count as absent.
 */

/** Trimmed, with an empty result standing in for a field that was not sent. */
function blankToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * A numeric string becomes a number; anything else is passed through unchanged
 * so that the type check downstream is the one that reports it. Returning `NaN`
 * here instead would describe every mistake as "expected number, received NaN".
 */
function toNumber(value: unknown): unknown {
  const trimmed = blankToUndefined(value);

  if (typeof trimmed !== "string") {
    return trimmed;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : value;
}

/**
 * `"true"` / `"false"` as they arrive from a query string or a form field.
 *
 * Only those two spellings. `parseBool` in src/utils reads everything that is
 * not `"true"` as false, which cannot tell a caller who meant `false` from one
 * who misspelled it — the point of validating at all.
 */
function toBoolean(value: unknown): unknown {
  const trimmed = blankToUndefined(value);

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  return trimmed;
}

function toDate(value: unknown): unknown {
  const trimmed = blankToUndefined(value);

  if (typeof trimmed !== "string") {
    return trimmed;
  }

  const parsed = new Date(trimmed);

  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

/**
 * The largest number a Postgres `integer` holds, which is what every whole
 * number in this schema is stored as.
 *
 * Bounded here rather than left to the database because Postgres answers a
 * value past it by refusing the query — a 500 about a numeric field being out
 * of range, for a request that was simply wrong on the way in.
 */
const INT4_MAX = 2_147_483_647;

/** An integer, however it was spelled on the way in. */
export const integer = z.preprocess(toNumber, z.int().max(INT4_MAX));
export const optionalInteger = z.preprocess(
  toNumber,
  z.int().max(INT4_MAX).optional(),
);

/**
 * A count of something, so at least one — how many levels a rubric has, say.
 *
 * The same rule as `id` and a different reason for it: these are numbers the
 * endpoint divides by or counts up to, where a zero is not a missing row but a
 * division by zero.
 */
export const positiveInteger = z.preprocess(
  toNumber,
  z.int().positive().max(INT4_MAX),
);

/**
 * A database id: a positive integer.
 *
 * Separate from `integer` because the tables' surrogate keys all start at 1, so
 * a zero or a negative is a caller mistake that would otherwise reach Postgres
 * and come back as "no such row" — indistinguishable from a real miss.
 */
export const id = z.preprocess(toNumber, z.int().positive().max(INT4_MAX));
export const optionalId = z.preprocess(
  toNumber,
  z.int().positive().max(INT4_MAX).optional(),
);

/** A number that is allowed a fractional part — a score, a weight, a ratio. */
export const decimal = z.preprocess(toNumber, z.number());
export const optionalDecimal = z.preprocess(toNumber, z.number().optional());

/** Non-empty text. Whitespace-only is empty. */
export const text = z.preprocess(blankToUndefined, z.string());
export const optionalText = z.preprocess(
  blankToUndefined,
  z.string().optional(),
);

/**
 * Text that may be sent empty on purpose — a description being cleared, say.
 * Distinct from `optionalText`, where blank means "no change was asked for".
 */
export const blankableText = z.string();

export const bool = z.preprocess(toBoolean, z.boolean());
export const optionalBool = z.preprocess(toBoolean, z.boolean().optional());

export const date = z.preprocess(toDate, z.date());
export const optionalDate = z.preprocess(toDate, z.date().optional());

/**
 * A nullable column the caller is allowed to empty.
 *
 * `""` and `null` are the two spellings of "clear this" — the first is a form
 * field the student blanked out, the second the same edit sent as JSON — and
 * both become `null`, which is what the services hand Prisma to write NULL. A
 * field that was not sent at all stays `undefined`, which is what leaves the
 * column alone.
 *
 * The distinction is the whole point: `optional*` reads an empty field as "no
 * instruction", which is right for a search filter and wrong for a form that
 * posts every input it has. Where the two were run together — the e-Portfolio
 * sections, whose services turned everything falsy into `undefined` — a date
 * entered by mistake could not be taken out again. See BEHAVIOR-CHANGES.md.
 */
function clearing(coerce: (value: unknown) => unknown) {
  return (value: unknown): unknown => {
    const trimmed = typeof value === "string" ? value.trim() : value;

    if (trimmed === "" || trimmed === null) {
      return null;
    }

    return coerce(value);
  };
}

export const clearableDate = z.preprocess(clearing(toDate), z.date().nullish());
export const clearableInteger = z.preprocess(
  clearing(toNumber),
  z.int().max(INT4_MAX).nullish(),
);
export const clearableDecimal = z.preprocess(
  clearing(toNumber),
  z.number().nullish(),
);

/** The primary key of `users` and `students`, which is a string of digits. */
export const userId = z.preprocess(blankToUndefined, z.string().min(1));
export const optionalUserId = z.preprocess(
  blankToUndefined,
  z.string().min(1).optional(),
);

export const uuid = z.preprocess(blankToUndefined, z.uuid());

type Json = z.infer<ReturnType<typeof z.json>>;

/**
 * Any JSON value except `null` — a rich-text document, a form's `detail` blob.
 *
 * The exception is Prisma's. It reads a literal `null` on a `Json` column as
 * "no value was given" and wants `Prisma.JsonNull` to store one, so a schema
 * that let `null` through would hand the services a value they cannot pass on.
 * Several of these columns are NOT NULL anyway, where it is not a value at all.
 */
export const jsonValue = z
  .json()
  .refine((value): value is Exclude<Json, null> => value !== null, {
    error: "ต้องไม่เป็นค่าว่าง",
  });

/**
 * Stands in for text that is not JSON at all.
 *
 * Not the original string: `"ไม่ใช่ JSON"` is unparseable, but a bare string is
 * itself a legal JSON value, so handing it on would let `z.json()` accept the
 * very text that failed to parse. A symbol satisfies no schema, so whatever the
 * field expected is what the caller is told it should have sent.
 */
const NOT_JSON = Symbol("unparseable JSON field");

/**
 * A field carrying JSON inside a multipart form.
 *
 * Uploads arrive as `multipart/form-data`, so a structured field — a rubric, a
 * list of members — is a string that the controller used to hand straight to
 * `JSON.parse` inside its try block. A missing or malformed one became a 500
 * describing a syntax error in a variable the caller has never heard of.
 *
 * Unparseable text is reported as the field being the wrong shape, because from
 * the caller's side that is what it is.
 */
export function jsonField<S extends z.ZodType>(schema: S) {
  return z.preprocess((value) => {
    const trimmed = blankToUndefined(value);

    if (typeof trimmed !== "string") {
      return trimmed;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return NOT_JSON;
    }
  }, schema);
}
