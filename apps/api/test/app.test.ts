import { describe, expect, it } from "vitest";
import request from "supertest";
import cron from "node-cron";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { BUCKET_NAME, minioClient } from "../src/config/minio";
import { sessionCookie } from "./helpers/session";

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
    expect(response.body).toEqual({ message: "File not found" });
  });
});

describe("GET /auth — verifyAnyRole", () => {
  it("rejects a request with no cookie", async () => {
    const response = await request(app).get("/auth");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
  });

  it("rejects a token signed with the wrong secret", async () => {
    // The point of signing rather than stubbing: this is the case a mocked
    // middleware could never fail on.
    const cookie = sessionCookie({
      userId: "10000001",
      secret: "a-different-secret-entirely",
    });

    const response = await request(app).get("/auth").set("Cookie", cookie);

    expect(response.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const cookie = sessionCookie({ userId: "10000001", expiresIn: "-1s" });

    const response = await request(app).get("/auth").set("Cookie", cookie);

    expect(response.status).toBe(401);
  });

  it("answers 404 when the token is valid but the user does not exist", async () => {
    const cookie = sessionCookie({ userId: "99999999" });

    const response = await request(app).get("/auth").set("Cookie", cookie);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
  });

  it("returns the profile and active roles for a real user", async () => {
    await prisma.roles.create({
      data: { role_id: "TEACHER", role_name: "Teacher", priority: 1 },
    });
    await prisma.users.create({
      data: {
        user_id: "10000001",
        email: "teacher@example.test",
        title_th: "อ.",
        first_name_th: "สมชาย",
        last_name_th: "ใจดี",
        user_roles_user_roles_user_idTousers: {
          create: { role_id: "TEACHER", is_active: true },
        },
      },
    });

    const response = await request(app)
      .get("/auth")
      .set("Cookie", sessionCookie({ userId: "10000001" }));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      user_id: "10000001",
      email: "teacher@example.test",
      name: "อ. สมชาย ใจดี",
      roles: ["TEACHER"],
    });
  });
});

describe("GET /user/student — verifyStudent", () => {
  it("answers 401 without a cookie", async () => {
    const response = await request(app).get("/user/student");

    expect(response.status).toBe(401);
  });

  it("answers 403 for a valid session that lacks the STUDENT role", async () => {
    // Authenticated is not authorised: the middleware re-reads the role from
    // user_roles rather than trusting the claim in the token, so a token that
    // says role: "STUDENT" gets nowhere without the row.
    await prisma.roles.create({
      data: { role_id: "LECTURER", role_name: "Lecturer", priority: 2 },
    });
    await prisma.users.create({
      data: {
        user_id: "20000002",
        email: "lecturer@example.test",
        user_roles_user_roles_user_idTousers: {
          create: { role_id: "LECTURER", is_active: true },
        },
      },
    });

    const response = await request(app)
      .get("/user/student")
      .set("Cookie", sessionCookie({ userId: "20000002", role: "STUDENT" }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
  });
});
