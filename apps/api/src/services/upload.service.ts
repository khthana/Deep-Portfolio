import { minioClient, BUCKET_NAME } from "../config/minio";
import { env } from "../config/env";
import { sanitizeFilename } from "../utils/sanitize-filename";

export default class MinIOService {
  async uploadFile(file: Express.Multer.File, folder: string) {
    try {
      const originalName = Buffer.from(file.originalname, "latin1").toString(
        "utf8",
      );

      const sanitizedName = sanitizeFilename(originalName);

      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const fileName = `${folder}/${timestamp}-${random}-${sanitizedName}`;

      await minioClient.putObject(
        BUCKET_NAME,
        fileName,
        file.buffer,
        file.size,
        { "Content-Type": file.mimetype },
      );

      // const fileUrl = `http://localhost:9000/${BUCKET_NAME}/${folder}/${fileName}`;

      // const presignedUrl = await minioClient.presignedGetObject(
      //   BUCKET_NAME,
      //   fileName,
      //   60 * 60
      // );

      return fileName;
    } catch (error) {
      console.error("Upload Error:", error);
    }
  }

  /**
   * Removes objects nobody points at any more.
   *
   * Called after the database transaction that dropped the rows has already
   * committed, so it cannot report failure to the caller — the delete has
   * happened as far as the request is concerned. A bucket that refuses leaves
   * an object nothing references, which costs space; the opposite order would
   * leave a row pointing at a file that is gone, which the reader sees. See
   * docs/adr/0008-attachment-lifecycle.md.
   */
  async removeFiles(paths: string[]) {
    if (paths.length === 0) return;

    try {
      await minioClient.removeObjects(BUCKET_NAME, paths);
    } catch (error) {
      console.error("Delete Error:", error);
    }
  }

  async getFile(path: string) {
    const presignedUrl = await minioClient.presignedGetObject(
      BUCKET_NAME,
      path,
      60 * 60,
    );
    console.log("presignedUrl:", presignedUrl);

    // The presigned URL points at the in-network MinIO host, which the
    // browser cannot resolve. Rewrite it to the externally reachable one.
    return presignedUrl.replace(env.MINIO_INTERNAL_HOST, env.MINIO_PUBLIC_HOST);
  }
}
