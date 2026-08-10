import { Router, type Response } from "express";
import { BUCKET_NAME, minioClient } from "../config/minio";
import { validate, validated } from "../validation/validate";
import { filesQuery } from "../validation/files.schema";
import { errorResponse } from "../utils/response";
import { assertSignedFileUrl } from "../utils/file-url";

/**
 * File delivery. This used to be three handlers — `/files`, `/uploads/:filename`
 * and `express.static("uploads")` — and the two `uploads` ones served a
 * directory nothing has written to since the hand-over: every route uploads
 * through `middlewares/upload-minio.ts`, so the multer that wrote to disk was
 * imported by nobody. They are gone rather than guarded (ADR-0006); the bucket
 * is the only place files live.
 *
 * Still mounted before the feature routers, so `/files` keeps resolving first.
 */
const filesRouter = Router();

filesRouter.get(
  "/files",
  validate({ query: filesQuery }),
  async (req, res: Response, next) => {
    const query = validated(req, filesQuery);

    try {
      assertSignedFileUrl(query);
    } catch (err) {
      // Forwarded rather than answered here: a refused signature is a 403 and
      // an expired one a 410, and the catch below turns everything it sees into
      // "the file is not there".
      return next(err);
    }

    try {
      const stream = await minioClient.getObject(BUCKET_NAME, query.path);

      const stat = await minioClient.statObject(BUCKET_NAME, query.path);
      res.setHeader("Content-Type", stat.metaData["content-type"]);
      stream.pipe(res);
    } catch {
      errorResponse(res, 404, "ไม่พบไฟล์ที่ต้องการ");
    }
  },
);

export default filesRouter;
