import type * as Minio from "minio";

/**
 * MinIO refuses to remove a bucket that still has objects in it, and a test
 * that uploaded anything leaves some behind. Shared by the per-file teardown
 * and by the sweep that clears debris from interrupted runs.
 */
export async function emptyAndRemoveBucket(
  client: Minio.Client,
  bucket: string,
): Promise<void> {
  const names: string[] = [];
  const stream = client.listObjectsV2(bucket, "", true);

  await new Promise<void>((resolve, reject) => {
    stream.on("data", (object) => {
      if (object.name) {
        names.push(object.name);
      }
    });
    stream.on("error", reject);
    stream.on("end", () => resolve());
  });

  if (names.length > 0) {
    await client.removeObjects(bucket, names);
  }

  await client.removeBucket(bucket);
}
