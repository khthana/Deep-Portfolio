import express, { Router, type Response } from "express";
import path from "path";
import { BUCKET_NAME, minioClient } from "../config/minio";
import { validate, validated } from "../validation/validate";
import {
  filesQuery,
  uploadParams,
  uploadQuery,
} from "../validation/files.schema";
import { errorResponse } from "../utils/response";

/**
 * File delivery. These three handlers used to sit inline in app.ts; the paths
 * are unchanged, and this router is mounted first so they keep resolving
 * before any of the feature routers.
 */
const filesRouter = Router();

filesRouter.get(
  "/uploads/:filename",
  validate({ params: uploadParams, query: uploadQuery }),
  (req, res) => {
    const { filename } = validated(req, uploadParams);
    const { title } = validated(req, uploadQuery);

    res.download(path.resolve("uploads", filename), title ?? filename);
  },
);

filesRouter.use("/uploads", express.static("uploads"));

filesRouter.get(
  "/files",
  validate({ query: filesQuery }),
  async (req, res: Response) => {
    const { path: objectKey } = validated(req, filesQuery);

    try {
      const stream = await minioClient.getObject(BUCKET_NAME, objectKey);

      const stat = await minioClient.statObject(BUCKET_NAME, objectKey);
      res.setHeader("Content-Type", stat.metaData["content-type"]);
      stream.pipe(res);
    } catch {
      errorResponse(res, 404, "ไม่พบไฟล์ที่ต้องการ");
    }
  },
);

export default filesRouter;
