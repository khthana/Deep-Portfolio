import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { createPortfolioEducation, createStudent } from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * Where the student studied before this — /portfolio-education.
 *
 * The plainest of the three list-and-detail sections in this group: no
 * attachments, no uploads, no type coercion, just rows keyed by user and
 * ordered newest first. Because it is the plainest, it is the one that carries
 * the group's shared error paths in full — a non-numeric id, an id that
 * belongs to nobody, a request that names no user — and the training and
 * certificate files lean on that rather than repeating all of it (T5).
 *
 * education_level is the one NOT NULL column in the portfolio group apart from
 * the ids, which is why a POST that omits it is refused rather than answered
 * with a blank field — a 400 from the schema since #20, a 500 from Postgres
 * before it.
 *
 * Since #31 the whole group is behind requireUser, and who a request acts for
 * is the session rather than whatever the request says. This file carries the
 * group's authorisation cases in full, for the same reason it carries the
 * shared error paths: 401 without a session, 403 for another student's list and
 * another student's row, and a create that ignores a user_id in the body. See
 * docs/adr/0001-portfolio-access.md.
 */

describe("GET /portfolio-education", () => {
  it("returns the student's schooling, most recent first", async () => {
    const student = await createStudent();
    const school = await createPortfolioEducation({
      user_id: student.student_id,
      education_level: "มัธยมศึกษาตอนปลาย",
      institution: "โรงเรียนตัวอย่าง",
      start_year: 2560,
      end_year: 2563,
    });
    const university = await createPortfolioEducation({
      user_id: student.student_id,
      education_level: "ปริญญาตรี",
      institution: "สถาบันตัวอย่าง",
      start_year: 2564,
    });

    const response = await request(app)
      .get("/portfolio-education")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((e: { id: number }) => e.id)).toEqual([
      university.id,
      school.id,
    ]);
    expect(response.body.data[1]).toEqual({
      id: school.id,
      user_id: student.student_id,
      education_level: "มัธยมศึกษาตอนปลาย",
      institution: "โรงเรียนตัวอย่าง",
      start_year: 2560,
      end_year: 2563,
      country: null,
      gpa: null,
      study_plan: null,
      faculty: null,
      major: null,
      is_show: true,
    });
  });

  it("refuses a request with no session", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-education")
      .query({ user_id: student.student_id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a student asking for somebody else's schooling", async () => {
    // See BEHAVIOR-CHANGES.md. user_id used to be the only thing that decided
    // whose rows came back, and nothing checked it against the caller.
    const owner = await createStudent();
    const stranger = await createStudent();
    await createPortfolioEducation({ user_id: owner.student_id });

    const response = await request(app)
      .get("/portfolio-education")
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .query({ user_id: owner.student_id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
    });
  });

  it("refuses a request that names no user", async () => {
    // See BEHAVIOR-CHANGES.md. This used to answer 200 with every student's
    // schooling, because an undefined user_id is not a filter Prisma applies —
    // it is no filter at all.
    const student = await createStudent();
    await createPortfolioEducation({ user_id: student.student_id });

    const response = await request(app)
      .get("/portfolio-education")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [
        { field: "user_id", location: "query", message: "ต้องระบุ" },
      ],
    });
  });
});

describe("GET /portfolio-education/:id", () => {
  it("returns the entry the id names", async () => {
    const student = await createStudent();
    const entry = await createPortfolioEducation({
      user_id: student.student_id,
      institution: "สถาบันตัวอย่าง",
      gpa: 3.45,
    });

    const response = await request(app)
      .get(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      institution: "สถาบันตัวอย่าง",
    });
  });

  it("sends the grade average as a number", async () => {
    // See BEHAVIOR-CHANGES.md. gpa is Decimal(3,2), and a Prisma Decimal handed
    // to res.json used to reach the wire as the string "3.45" — where the
    // frontend's copy of the type says number. Same shape as the score in
    // /evaluation/list, which #15 converted the same way.
    const student = await createStudent();
    const entry = await createPortfolioEducation({
      user_id: student.student_id,
      gpa: 3.45,
    });

    const response = await request(app)
      .get(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.body.data.gpa).toBe(3.45);
  });

  it("keeps the trailing zero off a whole grade average", async () => {
    // 3.50 is stored as Decimal(3,2) and comes back as 3.5 — the column's two
    // places are a storage detail, not a formatting instruction, and nothing
    // on the frontend prints gpa without formatting it first.
    const student = await createStudent();
    const entry = await createPortfolioEducation({
      user_id: student.student_id,
      gpa: 3.5,
    });

    const response = await request(app)
      .get(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.body.data.gpa).toBe(3.5);
  });

  it("refuses a request with no session", async () => {
    const entry = await createPortfolioEducation();

    const response = await request(app).get(`/portfolio-education/${entry.id}`);

    expect(response.status).toBe(401);
  });

  it("refuses another student's entry", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioEducation();

    const response = await request(app)
      .get(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
    });
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-education/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no entry", async () => {
    // The ownership middleware has nothing to check on a row that is not
    // there, so it stands aside and the controller answers as it always did.
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-education/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบประวัติการศึกษาที่ต้องการ",
    });
  });
});

describe("POST /portfolio-education", () => {
  it("creates an entry and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-education")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        education_level: "ปริญญาตรี",
        institution: "สถาบันตัวอย่าง",
        faculty: "คณะตัวอย่าง",
        major: "สาขาตัวอย่าง",
        start_year: 2564,
        gpa: 3.45,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      education_level: "ปริญญาตรี",
      institution: "สถาบันตัวอย่าง",
      start_year: 2564,
      gpa: 3.45,
    });

    const stored = await prisma.portfolio_education.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].faculty).toBe("คณะตัวอย่าง");
  });

  it("writes the entry for the signed-in student, whatever the body says", async () => {
    // See BEHAVIOR-CHANGES.md. The owner used to come from the body, so a
    // request could file schooling under somebody else's name. user_id is no
    // longer part of the schema, so it is dropped before the service sees it
    // and the row lands on the caller.
    const student = await createStudent();
    const stranger = await createStudent();

    const response = await request(app)
      .post("/portfolio-education")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        user_id: stranger.student_id,
        education_level: "ปริญญาตรี",
        institution: "สถาบันตัวอย่าง",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user_id).toBe(student.student_id);
    expect(
      await prisma.portfolio_education.count({
        where: { user_id: stranger.student_id },
      }),
    ).toBe(0);
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-education")
      .send({ education_level: "ปริญญาตรี", institution: "สถาบันไร้เจ้าของ" });

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_education.count({
        where: { institution: "สถาบันไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("fails when the request names no level of education", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-education")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ institution: "สถาบันตัวอย่าง" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: education_level ต้องระบุ",
      errors: [
        { field: "education_level", location: "body", message: "ต้องระบุ" },
      ],
    });
    expect(
      await prisma.portfolio_education.count({
        where: { user_id: student.student_id },
      }),
    ).toBe(0);
  });
});

describe("PUT /portfolio-education/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const student = await createStudent();
    const entry = await createPortfolioEducation({
      user_id: student.student_id,
      institution: "สถาบันเดิม",
      faculty: "คณะเดิม",
    });

    const response = await request(app)
      .put(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ institution: "สถาบันใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      institution: "สถาบันใหม่",
      faculty: "คณะเดิม",
    });
    expect(
      (
        await prisma.portfolio_education.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).institution,
    ).toBe("สถาบันใหม่");
  });

  it("keeps the entry with its owner however the request names one", async () => {
    // See BEHAVIOR-CHANGES.md. The body used to go to Prisma as it arrived, so
    // a request could rewrite user_id and move somebody else's entry onto
    // itself. The update schema has no user_id and unknown keys are stripped,
    // so the field is dropped before the service sees it.
    const owner = await createStudent();
    const stranger = await createStudent();
    const entry = await createPortfolioEducation({ user_id: owner.student_id });

    const response = await request(app)
      .put(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: owner.student_id }))
      .send({ user_id: stranger.student_id });

    expect(response.status).toBe(200);
    expect(
      (
        await prisma.portfolio_education.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).user_id,
    ).toBe(owner.student_id);
  });

  it("refuses a request with no session", async () => {
    const entry = await createPortfolioEducation({ institution: "สถาบันเดิม" });

    const response = await request(app)
      .put(`/portfolio-education/${entry.id}`)
      .send({ institution: "สถาบันใหม่" });

    expect(response.status).toBe(401);
    expect(
      (
        await prisma.portfolio_education.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).institution,
    ).toBe("สถาบันเดิม");
  });

  it("refuses another student's entry, and changes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioEducation({ institution: "สถาบันเดิม" });

    const response = await request(app)
      .put(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .send({ institution: "สถาบันใหม่" });

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_education.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).institution,
    ).toBe("สถาบันเดิม");
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-education/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ institution: "สถาบันใหม่" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an entry that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-education/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ institution: "สถาบันใหม่" });

    // P2025 used to leave here as a 500, telling the caller the server had
    // broken over a row that is merely absent (#42). It now says what GET says
    // about the same missing row.
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบประวัติการศึกษาที่ต้องการ",
    });
  });
});

describe("DELETE /portfolio-education/:id", () => {
  it("removes the entry and leaves the others alone", async () => {
    const student = await createStudent();
    const doomed = await createPortfolioEducation({
      user_id: student.student_id,
    });
    const kept = await createPortfolioEducation({
      user_id: student.student_id,
    });

    const response = await request(app)
      .delete(`/portfolio-education/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_education.findMany({
        where: { user_id: student.student_id },
      }),
    ).toHaveLength(1);
    expect(
      await prisma.portfolio_education.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
  });

  it("refuses a request with no session", async () => {
    const entry = await createPortfolioEducation();

    const response = await request(app).delete(
      `/portfolio-education/${entry.id}`,
    );

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_education.findUnique({ where: { id: entry.id } }),
    ).not.toBeNull();
  });

  it("refuses another student's entry, and deletes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioEducation();

    const response = await request(app)
      .delete(`/portfolio-education/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_education.findUnique({ where: { id: entry.id } }),
    ).not.toBeNull();
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-education/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an entry that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-education/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบประวัติการศึกษาที่ต้องการ",
    });
  });
});
