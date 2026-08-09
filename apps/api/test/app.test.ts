import { describe, expect, it } from "vitest";
import request from "supertest";
import cron from "node-cron";
import app from "../src/app";
import { BUCKET_NAME, minioClient } from "../src/config/minio";

/**
 * The first real tests in this repository. They are deliberately about the
 * seams rather than about features: that the app can be imported without
 * starting anything, that requests reach the real middleware, and that the
 * real Postgres and MinIO behind the suite are wired up correctly.
 *
 * Feature coverage — the 75 test cases from the hand-over document — comes in
 * later tickets and builds on exactly this setup.
 */

describe("the test environment itself", () => {
  it("runs in UTC regardless of the machine's timezone", () => {
    // Not a nicety. The schema stores timestamps with a hardcoded
    // "AT TIME ZONE 'Asia/Bangkok'" default, so a suite that inherited the
    // developer's clock would pass in Bangkok and fail in CI, or the reverse.
    // Pinning it here means a date assertion means the same thing everywhere.
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});

describe("importing the app", () => {
  it("schedules no cron jobs", () => {
    // The regression this guards: scheduling used to happen on import, so any
    // test that imported the app got a background job running against its
    // database. src/server.ts owns that side effect now (D4), and this test is
    // what stops it drifting back into src/app.ts.
    expect(cron.getTasks().size).toBe(0);
  });
});

describe("routing", () => {
  it("answers 404 for an unknown path", async () => {
    const response = await request(app).get("/no-such-route");

    expect(response.status).toBe(404);
  });
});

describe("GET /files", () => {
  it("returns the object when it exists in the bucket", async () => {
    // Written with the application's own MinIO client, so the test proves the
    // configured bucket is reachable rather than just that some bucket is.
    await minioClient.putObject(
      BUCKET_NAME,
      "greeting.txt",
      Buffer.from("hello from minio"),
      undefined,
      { "Content-Type": "text/plain" },
    );

    const response = await request(app).get("/files").query({ path: "greeting.txt" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("text/plain");
    expect(response.text).toBe("hello from minio");
  });

  it("answers 404 for an object that is not there", async () => {
    const response = await request(app)
      .get("/files")
      .query({ path: "definitely-not-uploaded.txt" });

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

describe("GET /uploads/:filename", () => {
  it("refuses a filename that climbs out of the uploads directory", async () => {
    // Express matches ":filename" against the encoded path, so the segment
    // cannot contain a slash — but it decodes the match before the handler
    // sees it, and the decoded name went straight to path.resolve.
    const response = await request(app).get("/uploads/..%2f..%2fpackage.json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: filename ต้องเป็นชื่อไฟล์ ไม่ใช่เส้นทาง",
      errors: [
        {
          field: "filename",
          location: "params",
          message: "ต้องเป็นชื่อไฟล์ ไม่ใช่เส้นทาง",
        },
      ],
    });
  });
});

describe("the error handler", () => {
  it("refuses a body that is not JSON without quoting it back", async () => {
    // express.json() rejects this before any route or schema is reached, and
    // attaches a 400 of its own. The status is worth keeping — the request is
    // what is wrong, not the server — but the message it comes with is an
    // English sentence quoting the bytes it choked on, and the frontend prints
    // `message` as-is. So the status is taken from it and the wording is not.
    const response = await request(app)
      .post("/auth/google")
      .set("Content-Type", "application/json")
      .send('{"credential": "secret-token"');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
    });
  });
});

describe("a protected route", () => {
  it("goes through the real auth middleware", async () => {
    // The seam this file is about: requests reach the middleware rather than
    // some test-only bypass. What the middleware then decides is auth.test.ts's
    // subject, not this one's.
    const response = await request(app).get("/auth");

    expect(response.status).toBe(401);
  });
});
