import { z } from "zod";

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
 *
 * These are the one set of fields in this directory built from bare `z.string()`
 * rather than from `fields.ts`. Everything there trims on the way in, which is
 * right for a name somebody typed and wrong for these: the signature is over the
 * exact bytes that were sent out, so a key trimmed on arrival would be checked
 * against a signature for a different string and refused with a 403 nobody could
 * account for.
 */
const verbatim = z.string();

export const filesQuery = z.object({
  path: verbatim.min(1),
  exp: verbatim.optional(),
  sig: verbatim.optional(),
});
