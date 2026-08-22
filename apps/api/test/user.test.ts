import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { createStudent, createTeacher, createUser } from "./factories";
import { BASELINE } from "./seed";
import { sessionCookie } from "./helpers/session";

/**
 * Who the caller is — /user.
 *
 * Two handlers that look alike and are not, though they now agree on whose data
 * a caller may read. GET /user still takes an id from the query, but the id has
 * to be the session's own (#40). GET /user/student ignores the query entirely,
 * takes the id from the session, and returns a narrowed profile assembled from
 * four tables.
 *
 * The generated columns matter here (T6). student.full_name_th is stored by
 * Postgres as first_name_th + last_name_th, so it is read back rather than
 * written, and no test may set it.
 */

describe("GET /user", () => {
  it("returns the signed-in user's own row", async () => {
    const user = await createTeacher({
      first_name_th: "สมชาย",
      last_name_th: "ใจดี",
      email: "somchai@example.test",
      phone: "021112222",
    });

    const response = await request(app)
      .get("/user")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .query({ id: user.user_id });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Fetched user successfully");
    expect(response.body.data).toMatchObject({
      user_id: user.user_id,
      email: "somchai@example.test",
      phone: "021112222",
      first_name_th: "สมชาย",
      last_name_th: "ใจดี",
      department_id: BASELINE.department.department_id,
      program_id: BASELINE.program.program_id,
    });
  });

  it("sends thirteen fields, and not the four beside them", async () => {
    // See BEHAVIOR-CHANGES.md. The service used to call findUnique with no
    // `select`, so this answered every scalar the table has — including the
    // caller's own password hash and their own verification token. Nothing on
    // the frontend has ever read any of the four; this is the case that keeps
    // them off the wire.
    const user = await createTeacher();

    const response = await request(app)
      .get("/user")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .query({ id: user.user_id });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual([
      "created_at",
      "department_id",
      "email",
      "first_name_en",
      "first_name_th",
      "last_name_en",
      "last_name_th",
      "phone",
      "program_id",
      "title_en",
      "title_th",
      "updated_at",
      "user_id",
    ]);
  });

  it("dates a row seven hours after it was written", async () => {
    // Pinned, not fixed. `users.created_at` is a `timestamp` with no zone and
    // its default is CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok', so what
    // Postgres stores is Bangkok local time and what Prisma reads back is that
    // same clock reading labelled UTC. Twenty-seven columns across the schema
    // carry that default, so the fix is a migration and a decision about every
    // one of them, not a change to this endpoint. See BEHAVIOR-CHANGES.md.
    const before = Date.now();
    const user = await createTeacher();

    const response = await request(app)
      .get("/user")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .query({ id: user.user_id });

    const drift = Date.parse(response.body.data.created_at) - before;

    expect(drift / (60 * 60 * 1000)).toBeCloseTo(7, 1);
  });

  it("answers for a student too, not only a teacher", async () => {
    // requireUser rather than requireRole: the row is `users`, which everybody
    // signed in has one of, and reading your own is not a teacher's privilege.
    const student = await createStudent();

    const response = await request(app)
      .get("/user")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.user_id).toBe(student.student_id);
  });

  it("refuses an id that belongs to somebody else", async () => {
    const user = await createTeacher();
    const colleague = await createTeacher();

    const response = await request(app)
      .get("/user")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .query({ id: colleague.user_id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
    });
  });

  it("refuses an id that belongs to nobody in the same words", async () => {
    // It used to answer 200 with null here. Telling "no such user" apart from
    // "not yours" would say which eight-character ids exist, which is the
    // question the route was answering for free before #40.
    const user = await createTeacher();

    const response = await request(app)
      .get("/user")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .query({ id: "99999999" });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
    );
  });

  it("answers 400 when no id is sent at all", async () => {
    // Not the same as an id that is not yours. The parameter used to reach
    // Prisma as `where: { user_id: undefined }`, which is not a question it
    // will answer, so the caller got a 500.
    const user = await createTeacher();

    const response = await request(app)
      .get("/user")
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องระบุ",
      errors: [{ field: "id", location: "query", message: "ต้องระบุ" }],
    });
  });

  it("refuses a request with no session", async () => {
    // Anyone who could guess an eight-character id used to read that person's
    // name, email and phone number without logging in at all (#40).
    const user = await createTeacher();

    const response = await request(app)
      .get("/user")
      .query({ id: user.user_id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });
});

describe("GET /user/student", () => {
  it("returns the signed-in student's profile", async () => {
    const student = await createStudent({
      first_name_th: "สมหญิง",
      last_name_th: "เรียนดี",
      title_th: "น.ส.",
      email: "somying@example.test",
      phone: "023334444",
    });

    const response = await request(app)
      .get("/user/student")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Fetched student successfully");
    expect(response.body.data).toEqual({
      user_id: student.student_id,
      student_id: student.student_id,
      // Generated by Postgres from the two name columns — never written.
      full_name_th: "สมหญิง เรียนดี",
      first_name_th: "สมหญิง",
      last_name_th: "เรียนดี",
      title_th: "น.ส.",
      email: "somying@example.test",
      phone: "023334444",
      department_name: BASELINE.department.department_name_th,
      program_name: BASELINE.program.program_name_th,
    });
  });

  it("ignores an id in the query and answers for the session", async () => {
    const student = await createStudent({ first_name_th: "สมหญิง" });
    const classmate = await createStudent({ first_name_th: "สมปอง" });

    const response = await request(app)
      .get("/user/student")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ id: classmate.student_id, student_id: classmate.student_id });

    expect(response.body.data.student_id).toBe(student.student_id);
    expect(response.body.data.first_name_th).toBe("สมหญิง");
  });

  it("answers 200 with null for a student row that does not exist", async () => {
    // requireRole only proves the STUDENT role is granted, and the role lives
    // on `users` — a user can hold it without ever having a `student` row.
    const user = await createUser({ roles: ["STUDENT"] });

    const response = await request(app)
      .get("/user/student")
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });

  it("refuses a request with no session", async () => {
    const response = await request(app).get("/user/student");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a teacher", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/user/student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
  });

  it("refuses a token this server did not sign", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/user/student")
      .set(
        "Cookie",
        sessionCookie({
          userId: student.student_id,
          secret: "not-the-servers-secret",
        }),
      );

    expect(response.status).toBe(401);
  });

  it("refuses an expired token", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/user/student")
      .set(
        "Cookie",
        sessionCookie({ userId: student.student_id, expiresIn: "-1s" }),
      );

    expect(response.status).toBe(401);
  });
});
