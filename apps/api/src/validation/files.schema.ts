import { z } from "zod";
import { optionalText, text } from "./fields";

/**
 * What `GET /files` is asked for: an object key, and the signature that says
 * this API handed that key out (see src/utils/file-url.ts).
 *
 * The key is allowed to be a path — objects are stored under prefixes such as
 * `activity/…`. There is no traversal to prevent: MinIO has no parent directory
 * to escape into, and a key that names nothing is the 404 this endpoint already
 * answers. What used to make the key dangerous was that naming one was enough
 * to be served it, which is now the signature's job.
 *
 * `exp` and `sig` are optional *here* and required by the route, which answers
 * `403` when either is missing. They are the permission rather than part of the
 * request's shape, so a request without them is refused, not corrected — the
 * schema would otherwise turn the hole this endpoint was closing into a 400
 * that reads like a typo.
 */
export const filesQuery = z.object({
  path: text,
  exp: optionalText,
  sig: optionalText,
});
