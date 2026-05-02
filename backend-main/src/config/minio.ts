import * as Minio from "minio";
import dotenv from "dotenv";

dotenv.config();

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "http://10.240.68.195/",
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET ?? "deep-portfolio";
