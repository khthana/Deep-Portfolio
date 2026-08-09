import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { createPortfolioEducation, createStudent } from "./factories";

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
 * Nothing on this route group is behind any middleware; the user being acted
 * for is whoever the query string says. That is #31.
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

  it("leaves out another student's schooling", async () => {
    const student = await createStudent();
    const mine = await createPortfolioEducation({
      user_id: student.student_id,
    });
    await createPortfolioEducation();

    const response = await request(app)
      .get("/portfolio-education")
      .query({ user_id: student.student_id });

    expect(response.body.data.map((e: { id: number }) => e.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    // See BEHAVIOR-CHANGES.md. This used to answer 200 with every student's
    // schooling, because an undefined user_id is not a filter Prisma applies —
    // it is no filter at all.
    await createPortfolioEducation();

    const response = await request(app).get("/portfolio-education");

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
    const entry = await createPortfolioEducation({
      institution: "สถาบันตัวอย่าง",
      gpa: 3.45,
    });

    const response = await request(app).get(`/portfolio-education/${entry.id}`);

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
    const entry = await createPortfolioEducation({ gpa: 3.45 });

    const response = await request(app).get(`/portfolio-education/${entry.id}`);

    expect(response.body.data.gpa).toBe(3.45);
  });

  it("keeps the trailing zero off a whole grade average", async () => {
    // 3.50 is stored as Decimal(3,2) and comes back as 3.5 — the column's two
    // places are a storage detail, not a formatting instruction, and nothing
    // on the frontend prints gpa without formatting it first.
    const entry = await createPortfolioEducation({ gpa: 3.5 });

    const response = await request(app).get(`/portfolio-education/${entry.id}`);

    expect(response.body.data.gpa).toBe(3.5);
  });

  it("answers 400 for an id that is not a number", async () => {
    const response = await request(app).get("/portfolio-education/abc");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no entry", async () => {
    const response = await request(app).get("/portfolio-education/999999");

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

    const response = await request(app).post("/portfolio-education").send({
      user_id: student.student_id,
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

  it("refuses a request that names no user", async () => {
    const response = await request(app)
      .post("/portfolio-education")
      .send({ education_level: "ปริญญาตรี", institution: "สถาบันไร้เจ้าของ" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [
        { field: "user_id", location: "body", message: "ต้องระบุ" },
      ],
    });
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
      .send({ user_id: student.student_id, institution: "สถาบันตัวอย่าง" });

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
    const entry = await createPortfolioEducation({
      institution: "สถาบันเดิม",
      faculty: "คณะเดิม",
    });

    const response = await request(app)
      .put(`/portfolio-education/${entry.id}`)
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
    // so the field is now dropped before the service sees it. Nothing yet
    // checks who is asking — that is still #31 — but this mechanism is closed.
    const owner = await createStudent();
    const stranger = await createStudent();
    const entry = await createPortfolioEducation({ user_id: owner.student_id });

    const response = await request(app)
      .put(`/portfolio-education/${entry.id}`)
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

  it("answers 400 for an id that is not a number", async () => {
    const response = await request(app)
      .put("/portfolio-education/abc")
      .send({ institution: "สถาบันใหม่" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for an entry that does not exist", async () => {
    const response = await request(app)
      .put("/portfolio-education/999999")
      .send({ institution: "สถาบันใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
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

    const response = await request(app).delete(
      `/portfolio-education/${doomed.id}`,
    );

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

  it("answers 400 for an id that is not a number", async () => {
    const response = await request(app).delete("/portfolio-education/abc");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for an entry that does not exist", async () => {
    const response = await request(app).delete("/portfolio-education/999999");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
