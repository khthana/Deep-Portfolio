import express, { Router, type Response } from "express";
import path from "path";
import { BUCKET_NAME, minioClient } from "../config/minio";

/**
 * File delivery. These three handlers used to sit inline in app.ts; the paths
 * are unchanged, and this router is mounted first so they keep resolving
 * before any of the feature routers.
 */
const filesRouter = Router();

filesRouter.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;

  const filePath = path.resolve("uploads", filename);

  const originalName = (req.query.title as string) || filename;

  res.download(filePath, originalName);
});

filesRouter.use("/uploads", express.static("uploads"));

filesRouter.get("/files", async (req, res: Response) => {
  const path = req.query.path as string;

  try {
    const stream = await minioClient.getObject(BUCKET_NAME, path);

    const stat = await minioClient.statObject(BUCKET_NAME, path);
    res.setHeader("Content-Type", stat.metaData["content-type"]);
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ message: "File not found" });
  }
});

export default filesRouter;
