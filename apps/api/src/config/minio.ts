import * as Minio from "minio";
import { requireEnv } from "./env";

export const minioClient = new Minio.Client({
  endPoint: requireEnv("MINIO_ENDPOINT"),
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  useSSL: false,
  accessKey: requireEnv("MINIO_ACCESS_KEY"),
  secretKey: requireEnv("MINIO_SECRET_KEY"),
});

export const BUCKET_NAME = process.env.MINIO_BUCKET ?? "deep-portfolio";
