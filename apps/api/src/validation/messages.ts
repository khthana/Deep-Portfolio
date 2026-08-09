import { z } from "zod";

/**
 * Turning a Zod issue into the sentence the user reads.
 *
 * Error text reaches the browser and is rendered as-is, so it is Thai — see the
 * language convention in CLAUDE.md. The translation lives here rather than in
 * each schema on purpose: there are around 150 endpoints, and a `message` typed
 * out at every field would guarantee that the same mistake is described three
 * different ways depending on which endpoint you hit. A schema only writes its
 * own message when the rule is one nobody could guess from the type, and it
 * writes it as `.refine(…, { error })` — a refinement is what arrives here as a
 * `custom` issue, the one code that is passed through untouched. `.regex(…,
 * { error })` is not: Zod reports that as a format issue, and a format this file
 * has no name for can only be described as "the format is wrong".
 */

/** What a value of each type is called, in the sentence "… ต้องเป็น X". */
const TYPE_NAMES: Record<string, string> = {
  string: "ข้อความ",
  number: "ตัวเลข",
  int: "จำนวนเต็ม",
  bigint: "จำนวนเต็ม",
  // "ค่า" so the sentence does not run Thai straight into Latin script:
  // "ต้องเป็นค่า true หรือ false", not "ต้องเป็นtrue หรือ false".
  boolean: "ค่า true หรือ false",
  array: "รายการ",
  object: "ข้อมูลแบบออบเจกต์",
  date: "วันที่ที่ถูกต้อง",
  file: "ไฟล์",
};

/**
 * Formats named by `z.string().uuid()` and friends.
 *
 * The two whose names are written in Latin script get a Thai word in front of
 * them, for the reason `boolean` above does: "ต้องเป็นUUID" runs the two
 * alphabets together with nothing between them.
 */
const FORMAT_NAMES: Record<string, string> = {
  uuid: "รหัส UUID",
  email: "อีเมล",
  url: "ที่อยู่ URL",
  datetime: "วันที่และเวลาตามรูปแบบ ISO 8601",
  date: "วันที่ตามรูปแบบ YYYY-MM-DD",
  time: "เวลาตามรูปแบบ HH:MM",
};

/** `["members", 0, "student_id"]` → `"members[0].student_id"`. */
export function formatPath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((joined, segment) => {
    if (typeof segment === "number") {
      return `${joined}[${segment}]`;
    }

    return joined === "" ? String(segment) : `${joined}.${String(segment)}`;
  }, "");
}

function listValues(values: readonly unknown[]): string {
  return values.map((value) => String(value)).join(", ");
}

/**
 * Whether the issue is really "you left this out".
 *
 * Zod does not have a separate code for it — a missing field is an
 * `invalid_type` against `undefined`, and once a coercing schema has run its
 * preprocessing the issue no longer says what it started as. So the raw request
 * is consulted instead: an issue on a field that was never sent is a missing
 * field, whatever Zod called it. Optional fields never reach here, because a
 * value that is allowed to be absent produces no issue when it is.
 */
function wasNotSent(issue: z.core.$ZodIssue, input: unknown): boolean {
  return valueAtPath(input, issue.path) === undefined;
}

/**
 * Codes whose message stands whether or not the field was sent.
 *
 * `custom` is a rule the schema wrote out itself, and the ones that point at an
 * absent field are the conditional ones — "required when the work is a group
 * submission". "ต้องระบุ" would be true but would drop the half that says when.
 * `unrecognized_keys` names its keys in the message and hangs off the object
 * rather than off any one field, so the field it "was not sent" for is the
 * object's own empty path.
 */
const SPEAKS_FOR_ITSELF = new Set(["custom", "unrecognized_keys"]);

function valueAtPath(input: unknown, path: readonly PropertyKey[]): unknown {
  let current = input;

  for (const segment of path) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<PropertyKey, unknown>)[segment];
  }

  return current;
}

function typeName(expected: string): string {
  return TYPE_NAMES[expected] ?? expected;
}

/**
 * The Thai half of one issue — a predicate about the field, with the field name
 * left to the caller so it can read "section_id ต้องเป็นจำนวนเต็ม".
 */
export function thaiMessage(issue: z.core.$ZodIssue, input: unknown): string {
  if (!SPEAKS_FOR_ITSELF.has(issue.code) && wasNotSent(issue, input)) {
    return "ต้องระบุ";
  }

  switch (issue.code) {
    case "invalid_type":
      return `ต้องเป็น${typeName(issue.expected)}`;

    case "invalid_value":
      return `ต้องเป็นค่าใดค่าหนึ่งใน: ${listValues(issue.values)}`;

    case "invalid_format":
      return FORMAT_NAMES[issue.format]
        ? `ต้องเป็น${FORMAT_NAMES[issue.format]}`
        : "รูปแบบไม่ถูกต้อง";

    case "too_small":
      return tooSmall(issue);

    case "too_big":
      return tooBig(issue);

    case "not_multiple_of":
      return `ต้องเป็นจำนวนเท่าของ ${issue.divisor}`;

    case "unrecognized_keys":
      return `มีฟิลด์ที่ไม่รู้จัก: ${issue.keys.join(", ")}`;

    // Every branch of the union failed, and each failed for its own reason.
    // Naming one of them would be arbitrary, so the field is named and the
    // reason is not.
    case "invalid_union":
      return "รูปแบบไม่ถูกต้อง";

    // Written by the schema itself, already in Thai. Zod fills in an English
    // default when a refinement gives no message, which is what the fallback
    // covers.
    case "custom":
      return issue.message || "ไม่ถูกต้อง";

    default:
      return "ไม่ถูกต้อง";
  }
}

function tooSmall(issue: z.core.$ZodIssueTooSmall): string {
  const minimum = Number(issue.minimum);

  switch (issue.origin) {
    case "string":
      return minimum <= 1
        ? "ต้องไม่เป็นค่าว่าง"
        : `ต้องมีอย่างน้อย ${minimum} ตัวอักษร`;

    case "array":
    case "set":
      return `ต้องมีอย่างน้อย ${minimum} รายการ`;

    default:
      return issue.inclusive
        ? `ต้องไม่น้อยกว่า ${minimum}`
        : `ต้องมากกว่า ${minimum}`;
  }
}

function tooBig(issue: z.core.$ZodIssueTooBig): string {
  const maximum = Number(issue.maximum);

  switch (issue.origin) {
    case "string":
      return `ต้องยาวไม่เกิน ${maximum} ตัวอักษร`;

    case "array":
    case "set":
      return `ต้องมีไม่เกิน ${maximum} รายการ`;

    default:
      return issue.inclusive
        ? `ต้องไม่เกิน ${maximum}`
        : `ต้องน้อยกว่า ${maximum}`;
  }
}
