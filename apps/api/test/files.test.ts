import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { BUCKET_NAME, minioClient } from "../src/config/minio";
import { signFileUrl } from "../src/utils/file-url";
import { sessionCookie } from "./helpers/session";

/**
 * File delivery — /files.
 *
 * The one route that streams out of the object store, and until ADR-0006 the
 * one route that would do it for anybody: naming an object key was the whole of
 * the permission, so a student's certificate scan or another section's marked
 * work was readable by anyone who could guess or keep a key. A session in front
 * of it would not have helped — files are fetched as `<img src>` and `<a href>`
 * from a web app that is a different origin in development, and the session
 * cookie is SameSite=Lax.
 *
 * So the URL carries the permission instead. It is minted where the key leaves
 * the API — `AttachmentsService.getAttachments`, behind whichever guard the
 * endpoint asking for it has — and this route only checks the signature. These
 * cases are about that check; that the endpoints really hand out signed URLs is
 * asserted where those endpoints are tested (activity.test.ts, portfolio.test.ts).
 *
 * `signFileUrl` is imported rather than reimplemented for the same reason the
 * suite writes objects with the application's own MinIO client: the case is
 * about the round trip, not about a second copy of the algorithm.
 */

const CONTENTS = "hello from minio";

/** Put an object there to be served, and answer the URL that serves it. */
async function storedFile(objectKey: string, now?: number) {
  await minioClient.putObject(
    BUCKET_NAME,
    objectKey,
    Buffer.from(CONTENTS),
    undefined,
    { "Content-Type": "text/plain" },
  );

  return signFileUrl(objectKey, now);
}

/** The same URL with one parameter rewritten, which is what a caller trying
 *  their luck with somebody else's file would send. */
function tamper(url: string, field: "path" | "exp", value: string) {
  const [, query] = url.split("?");
  const params = new URLSearchParams(query);
  params.set(field, value);

  return `/files?${params}`;
}

describe("GET /files", () => {
  it("serves the object when the URL is one this API signed", async () => {
    const url = await storedFile("greeting.txt");

    const response = await request(app).get(url);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("text/plain");
    expect(response.text).toBe(CONTENTS);
  });

  it("serves a key that is a path under a prefix", async () => {
    // Keys are composed by the API as `activity/…`, `65000001/…` and so on, and
    // the whole key including its slashes is what gets signed.
    const url = await storedFile("activity/17/handout.txt");

    const response = await request(app).get(url);

    expect(response.status).toBe(200);
    expect(response.text).toBe(CONTENTS);
  });

  it("refuses a request with no signature at all", async () => {
    // The hole this route had: the key alone used to be enough.
    await storedFile("secret-transcript.txt");

    const response = await request(app)
      .get("/files")
      .query({ path: "secret-transcript.txt" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "ลิงก์ไฟล์นี้ไม่ถูกต้อง",
    });
    expect(response.text).not.toContain(CONTENTS);
  });

  it("refuses a request with no signature from a signed-in caller too", async () => {
    // The other half of the same rule, and the one worth writing down: a
    // session buys nothing here. It is not that the route trusts nobody — it is
    // that it does not read the cookie at all, because the share link has to
    // work without one. Whoever is asking is not the question; who signed the
    // link is.
    await storedFile("someone-elses-transcript.txt");

    const response = await request(app)
      .get("/files")
      .query({ path: "someone-elses-transcript.txt" })
      .set("Cookie", sessionCookie({ userId: "65000001", role: "STUDENT" }));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("ลิงก์ไฟล์นี้ไม่ถูกต้อง");
    expect(response.text).not.toContain(CONTENTS);
  });

  it("refuses a signature issued for a different file", async () => {
    // A caller who has a URL of their own and rewrites the key in it — the
    // signature covers the key, so it stops being valid.
    const mine = await storedFile("mine.txt");
    await storedFile("someone-elses.txt");

    const response = await request(app).get(
      tamper(mine, "path", "someone-elses.txt"),
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("ลิงก์ไฟล์นี้ไม่ถูกต้อง");
  });

  it("refuses an expiry that has been pushed forward by hand", async () => {
    const url = await storedFile("extendable.txt");

    const response = await request(app).get(
      tamper(url, "exp", String(Math.floor(Date.now() / 1000) + 60 * 60 * 24)),
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("ลิงก์ไฟล์นี้ไม่ถูกต้อง");
  });

  it("answers 410 for a URL that was ours but has expired", async () => {
    // Signed two hours ago, so its hour ran out an hour ago. Told apart from a
    // forged link on purpose: reloading the page fixes this one.
    const url = await storedFile(
      "stale.txt",
      Date.now() - 2 * 60 * 60 * 1000,
    );

    const response = await request(app).get(url);

    expect(response.status).toBe(410);
    expect(response.body).toEqual({
      success: false,
      message: "ลิงก์ไฟล์นี้หมดอายุแล้ว กรุณาโหลดหน้านี้ใหม่",
    });
  });

  it("answers 404 for a signed key that names nothing", async () => {
    const response = await request(app).get(
      signFileUrl("definitely-not-uploaded.txt"),
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบไฟล์ที่ต้องการ",
    });
  });

  it("answers 400 when no path is asked for", async () => {
    const response = await request(app).get("/files");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: path ต้องระบุ",
      errors: [{ field: "path", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /uploads", () => {
  it("is gone", async () => {
    // Both handlers served a directory nothing had written to since the
    // hand-over — every route uploads to MinIO — and neither checked anything.
    // Removed rather than guarded, so there is one way in and it is signed.
    const response = await request(app).get("/uploads/anything.pdf");

    expect(response.status).toBe(404);
  });
});
