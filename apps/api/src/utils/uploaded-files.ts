import { Request } from "express";

/**
 * What multer left on the request, in the shape the route asked it for.
 *
 * `req.files` is typed as the union of everything multer can produce, because
 * the type cannot know which of its middlewares a route registered. Only the
 * route knows, so the narrowing has to happen at the handler — and it was
 * happening nineteen times over, as the same cast written out by hand. It is
 * written once here instead, so the two shapes are named rather than asserted
 * and there is one place to look when multer's own types move.
 */

/** For a route behind `upload.array(...)`: the files, or none. */
export function uploadedFiles(req: Request): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : [];
}

/** For a route behind `upload.fields(...)`: the files under each field name. */
export function uploadedFileFields(
  req: Request,
): Record<string, Express.Multer.File[]> {
  return req.files && !Array.isArray(req.files) ? req.files : {};
}
