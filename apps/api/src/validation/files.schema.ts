import { z } from "zod";
import { optionalText, text } from "./fields";

/**
 * `:filename` names one file inside the uploads directory, and nothing else.
 *
 * Express matches the parameter against the still-encoded path, so a segment
 * cannot contain a literal `/` — but it is decoded before the handler sees it,
 * and `%2e%2e%2f` decodes to `../` after the match has already succeeded. The
 * name then goes to `path.resolve`, which resolves the traversal happily. The
 * check has to be on the decoded value, which is what this is.
 */
const TRAVERSAL = /[/\\]|^\.\.?$/;

export const uploadParams = z.object({
  filename: text.refine((value) => !TRAVERSAL.test(value), {
    error: "ต้องเป็นชื่อไฟล์ ไม่ใช่เส้นทาง",
  }),
});

export const uploadQuery = z.object({
  title: optionalText,
});

/**
 * The object key inside the bucket, which unlike the above is allowed to be a
 * path — objects are stored under prefixes such as `activity/…`. There is no
 * traversal to prevent: MinIO has no parent directory to escape into, and a key
 * that names nothing is the 404 this endpoint already answers.
 */
export const filesQuery = z.object({
  path: text,
});
