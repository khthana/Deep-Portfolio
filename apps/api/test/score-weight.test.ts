import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createActivity,
  createCourse,
  createScoreWeight,
  createTeacher,
  createUser,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * The score categories of a section and their weights — /score-weight.
 *
 * Reading is open; writing is a teacher's, and as everywhere else in this API
 * that means any teacher rather than this section's teacher.
 *
 * Two things are worth knowing before reading the cases. sequence_order is
 * assigned by the server, not sent by the caller. And nothing enforces that a
 * section's weights add up to 100 — the UI shows a running total, the API takes
 * whatever it is given.
 */

describe("GET /score-weight", () => {
  it("returns the section's categories, oldest first", async () => {
    const course = await createCourse();
    const midterm = await createScoreWeight({
      section_id: course.section_id,
      score_category: "สอบกลางภาค",
      weight: 30,
    });
    const final = await createScoreWeight({
      section_id: course.section_id,
      score_category: "สอบปลายภาค",
      weight: 40,
    });

    // No cookie: the student's course page shows the same table.
    const response = await request(app)
      .get("/score-weight")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        score_ratio_id: midterm.score_ratio_id,
        score_category: "สอบกลางภาค",
        weight: 30,
        sequence_order: 1,
      }),
      expect.objectContaining({
        score_ratio_id: final.score_ratio_id,
        score_category: "สอบปลายภาค",
        weight: 40,
        sequence_order: 2,
      }),
    ]);
  });

  it("answers with exactly the keys a score category has", async () => {
    // The row is handed over whole — `findMany` with no `select` — so the
    // bookkeeping columns ride along with the three the table shows. Written
    // out in full because `ScoreWeightDetail` in @deep-portfolio/api-types is
    // written from this case (#68), and the two dates are the reason: they are
    // Date objects inside the service and ISO strings by the time a caller
    // reads them.
    const course = await createCourse();
    const category = await createScoreWeight({
      section_id: course.section_id,
      score_category: "สอบกลางภาค",
      weight: 30,
    });

    const response = await request(app)
      .get("/score-weight")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        score_ratio_id: category.score_ratio_id,
        sequence_order: 1,
        score_category: "สอบกลางภาค",
        weight: 30,
        created_at: category.created_at?.toISOString(),
        updated_at: category.updated_at?.toISOString(),
        section_id: course.section_id,
      },
    ]);
  });

  it("returns only this section's categories", async () => {
    const course = await createCourse();
    const otherCourse = await createCourse();
    const mine = await createScoreWeight({ section_id: course.section_id });
    await createScoreWeight({ section_id: otherCourse.section_id });

    const response = await request(app)
      .get("/score-weight")
      .query({ section_id: course.section_id });

    expect(
      response.body.data.map(
        (weight: { score_ratio_id: number }) => weight.score_ratio_id,
      ),
    ).toEqual([mine.score_ratio_id]);
  });

  it("answers 400 when section_id is missing", async () => {
    // It used to answer 200 with an empty list: parseInt(undefined) is NaN,
    // Prisma sends NaN across as null, and "section_id IS NULL" matches nothing
    // — so a caller that forgot the parameter was told the section was empty.
    await createScoreWeight({ section_id: (await createCourse()).section_id });

    const response = await request(app).get("/score-weight");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: section_id ต้องระบุ",
      errors: [{ field: "section_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("POST /score-weight", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/score-weight").send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();

    const response = await request(app)
      .post("/score-weight")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({
        score_category: "สอบกลางภาค",
        weight: 30,
        section_id: course.section_id,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });

    const stored = await prisma.subject_score_ratio.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toEqual([]);
  });

  it("adds a category and returns its id", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        score_category: "สอบกลางภาค",
        weight: 30,
        section_id: course.section_id,
        created_by: teacher.user_id,
      });

    expect(response.status).toBe(200);
    // The id itself, not an object holding one. The web declared
    // `{ score_weight_id: number }` for this until #68 — a body that is not an
    // object, under a key no endpoint here sends. (`score_weight_id` is real
    // on the student's classwork list, which renames `score_ratio_id` to it.)
    expect(response.body.data).toEqual(expect.any(Number));

    const stored = await prisma.subject_score_ratio.findUnique({
      where: { score_ratio_id: response.body.data },
    });
    expect(stored).toMatchObject({
      score_category: "สอบกลางภาค",
      weight: 30,
      section_id: course.section_id,
      sequence_order: 1,
    });
  });

  it("puts each new category after the last one in the section", async () => {
    // sequence_order comes from the server: the highest in this section, plus
    // one. The caller may send one; it is ignored.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    await createScoreWeight({
      section_id: course.section_id,
      sequence_order: 7,
    });

    const response = await request(app)
      .post("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        score_category: "สอบปลายภาค",
        weight: 40,
        sequence_order: 1,
        section_id: course.section_id,
      });

    const stored = await prisma.subject_score_ratio.findUnique({
      where: { score_ratio_id: response.body.data },
    });
    expect(stored?.sequence_order).toBe(8);
  });

  it("numbers each section's categories independently", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const otherCourse = await createCourse({ teacher_id: teacher.user_id });
    await createScoreWeight({ section_id: otherCourse.section_id });
    await createScoreWeight({ section_id: otherCourse.section_id });

    const response = await request(app)
      .post("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        score_category: "สอบกลางภาค",
        weight: 30,
        section_id: course.section_id,
      });

    const stored = await prisma.subject_score_ratio.findUnique({
      where: { score_ratio_id: response.body.data },
    });
    expect(stored?.sequence_order).toBe(1);
  });

  it("fails for a section that does not exist", async () => {
    // subject_score_ratio.section_id is a real foreign key, unlike most of the
    // section columns in this schema — so this is P2003, and stays a 500 where
    // PUT and DELETE below became 404s. Those two address a row that is gone;
    // this one carries a section id in the body that names nothing (#42).
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        score_category: "สอบกลางภาค",
        weight: 30,
        section_id: 999_999,
      });

    expect(response.status).toBe(500);
  });

  it("answers 400 for a weight that is not a number", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        score_category: "สอบกลางภาค",
        weight: "สามสิบ",
        section_id: course.section_id,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "weight", location: "body", message: "ต้องเป็นตัวเลข" },
    ]);

    const stored = await prisma.subject_score_ratio.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toEqual([]);
  });

  it("answers 400 when the request carries neither a category nor a weight", async () => {
    // A different mistake from the case above, and worth its own: that one
    // sends a weight of the wrong type, this one sends no weight at all. Both
    // fields are named, so a form that posted nothing is told everything it
    // owes rather than one field at a time (TC-08).
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ section_id: course.section_id });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "score_category", location: "body", message: "ต้องระบุ" },
      { field: "weight", location: "body", message: "ต้องระบุ" },
    ]);

    const stored = await prisma.subject_score_ratio.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toEqual([]);
  });
});

describe("PUT /score-weight", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).put("/score-weight").send({});

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const weight = await createScoreWeight({
      section_id: course.section_id,
      weight: 30,
    });

    const response = await request(app)
      .put("/score-weight")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({
        score_id: weight.score_ratio_id,
        score_category: "สอบกลางภาค",
        weight: 50,
      });

    expect(response.status).toBe(403);

    const stored = await prisma.subject_score_ratio.findUnique({
      where: { score_ratio_id: weight.score_ratio_id },
    });
    expect(stored?.weight).toBe(30);
  });

  it("changes the category name and its weight", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const weight = await createScoreWeight({
      section_id: course.section_id,
      score_category: "สอบย่อย",
      weight: 10,
    });

    const response = await request(app)
      .put("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        score_id: weight.score_ratio_id,
        score_category: "สอบกลางภาค",
        weight: 30,
      });

    expect(response.status).toBe(200);
    // Every key: the updated row goes back whole, the same shape `GET` answers.
    // `updated_at` is the value the row was created with — the column has a
    // default and no `@updatedAt`, so nothing bumps it on a write (#68).
    expect(response.body.data).toEqual({
      score_ratio_id: weight.score_ratio_id,
      sequence_order: weight.sequence_order,
      score_category: "สอบกลางภาค",
      weight: 30,
      created_at: weight.created_at?.toISOString(),
      updated_at: weight.updated_at?.toISOString(),
      section_id: course.section_id,
    });

    const stored = await prisma.subject_score_ratio.findUnique({
      where: { score_ratio_id: weight.score_ratio_id },
    });
    expect(stored).toMatchObject({
      score_category: "สอบกลางภาค",
      weight: 30,
    });
  });

  it("answers 404 for a category that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .put("/score-weight")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ score_id: 999_999, score_category: "สอบกลางภาค", weight: 30 });

    // P2025 used to leave here as a 500, telling the caller the server had
    // broken over a row that is merely absent (#42). These routes own no
    // sentence of their own, so the error handler's general one stands.
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลที่ต้องการ",
    });
  });
});

describe("DELETE /score-weight", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).delete("/score-weight");

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const weight = await createScoreWeight({ section_id: course.section_id });

    const response = await request(app)
      .delete("/score-weight")
      .query({ scoreId: weight.score_ratio_id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);

    const stored = await prisma.subject_score_ratio.findUnique({
      where: { score_ratio_id: weight.score_ratio_id },
    });
    expect(stored).not.toBeNull();
  });

  it("removes the category", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const doomed = await createScoreWeight({ section_id: course.section_id });
    const kept = await createScoreWeight({ section_id: course.section_id });

    const response = await request(app)
      .delete("/score-weight")
      .query({ scoreId: doomed.score_ratio_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    // The row that was removed, whole — the same shape again.
    expect(response.body.data).toEqual({
      score_ratio_id: doomed.score_ratio_id,
      sequence_order: doomed.sequence_order,
      score_category: doomed.score_category,
      weight: doomed.weight,
      created_at: doomed.created_at?.toISOString(),
      updated_at: doomed.updated_at?.toISOString(),
      section_id: course.section_id,
    });

    const remaining = await prisma.subject_score_ratio.findMany({
      where: { section_id: course.section_id },
    });
    expect(remaining.map((weight) => weight.score_ratio_id)).toEqual([
      kept.score_ratio_id,
    ]);
  });

  it("leaves the activities that used it, unassigned", async () => {
    // The activity is not deleted with the category — the foreign key is ON
    // DELETE SET NULL, so the work survives and simply counts towards nothing
    // until the teacher assigns it a new category.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const weight = await createScoreWeight({ section_id: course.section_id });
    const activity = await createActivity({ section_id: course.section_id });
    await prisma.activities.update({
      where: { id: activity.id },
      data: { score_ratio_id: weight.score_ratio_id },
    });

    await request(app)
      .delete("/score-weight")
      .query({ scoreId: weight.score_ratio_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    const stored = await prisma.activities.findUnique({
      where: { id: activity.id },
    });
    expect(stored?.score_ratio_id).toBeNull();
  });

  it("does not leave the section's numbering contiguous", async () => {
    // Recorded because POST fills the next gap from the top, not the first
    // hole: delete the middle of 1, 2, 3 and the next category added is 4.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    await createScoreWeight({ section_id: course.section_id });
    const middle = await createScoreWeight({ section_id: course.section_id });
    await createScoreWeight({ section_id: course.section_id });

    await request(app)
      .delete("/score-weight")
      .query({ scoreId: middle.score_ratio_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    const remaining = await prisma.subject_score_ratio.findMany({
      where: { section_id: course.section_id },
      orderBy: { score_ratio_id: "asc" },
    });
    expect(remaining.map((weight) => weight.sequence_order)).toEqual([1, 3]);
  });

  it("answers 404 for a category that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .delete("/score-weight")
      .query({ scoreId: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลที่ต้องการ",
    });
  });
});

describe("GET /score-weight/options", () => {
  it("returns each category as a dropdown option", async () => {
    const course = await createCourse();
    const midterm = await createScoreWeight({
      section_id: course.section_id,
      score_category: "สอบกลางภาค",
      weight: 30,
    });
    const final = await createScoreWeight({
      section_id: course.section_id,
      score_category: "สอบปลายภาค",
      weight: 40,
    });

    const response = await request(app)
      .get("/score-weight/options")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { value: midterm.score_ratio_id, label: "สอบกลางภาค (30%)" },
      { value: final.score_ratio_id, label: "สอบปลายภาค (40%)" },
    ]);
  });

  it("returns an empty list for a section with no categories", async () => {
    const course = await createCourse();

    const response = await request(app)
      .get("/score-weight/options")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 400 when section_id is missing", async () => {
    const response = await request(app).get("/score-weight/options");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});
