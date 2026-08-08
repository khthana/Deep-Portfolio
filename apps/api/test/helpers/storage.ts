import { BUCKET_NAME, minioClient } from "../../src/config/minio";

/**
 * What is in the bucket right now.
 *
 * The database is not the only place a request leaves a mark: an upload route
 * writes an object to MinIO before any of its own code runs, because multer is
 * middleware. A case about whether a rejected request uploaded anything cannot
 * see that in Postgres, so it looks here.
 *
 * Reads through the application's own client, for the same reason the other
 * cases read through the application's own Prisma — the test harness pointed
 * both at a private, per-file store in test/setup.ts, and going around them
 * would only prove something about a different bucket.
 */
export function listStoredObjects(prefix = ""): Promise<string[]> {
  const names: string[] = [];
  const stream = minioClient.listObjectsV2(BUCKET_NAME, prefix, true);

  return new Promise((resolve, reject) => {
    stream.on("data", (object) => {
      if (object.name) names.push(object.name);
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(names));
  });
}
