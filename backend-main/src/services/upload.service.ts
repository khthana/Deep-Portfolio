import { minioClient, BUCKET_NAME } from "../config/minio";
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

  async getFile(path: string) {
    const presignedUrl = await minioClient.presignedGetObject(
      BUCKET_NAME,
      path,
      60 * 60,
    );
    console.log("presignedUrl:", presignedUrl);

    return presignedUrl.replace("minio:9000", "10.240.68.8:9002");
  }

  // async getFile(path: string) {
  //   const presignedUrl = await minioClient.presignedGetObject(
  //     BUCKET_NAME,
  //     path,
  //     60 * 60,
  //   );
  //   console.log("presignedUrl:", presignedUrl);

  //   return presignedUrl.replace("minio:9000", "10.240.68.8:9002");
  // }
}
