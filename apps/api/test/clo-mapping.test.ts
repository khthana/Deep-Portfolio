import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createActivity,
  createActivityRubric,
  createCLO,
  createCourse,
  createLearningActivity,
  createScoreWeight,
  createTeacher,
  createUser,
  mapActivityToCLO,
  mapLearningActivityToCLO,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * What a piece of work measures — /mapping/activity and
 * /mapping/learning-activity.
 *
 * This is the join the outcome-based model rests on: without it a mark is just
 * a number, and with it the same mark counts towards a CLO and through that a
 * PLO. Both tables carry a sequence_order that the caller never sends — the
 * endpoint takes the highest one already on the activity and adds one.
 *
 * The two are not symmetrical. An activity has a score, so its mapping records
 * how much of that score the CLO is worth and caches the resulting number, and
 * it has a real foreign key to the activity's score category. A learning
 * activity is not marked, so its mapping is the link and nothing else.
 *
 * Neither table has a foreign key on clo_id, so nothing stops a mapping
 * pointing at a CLO that was deleted, or never existed.
 */

/** An activity that POST /mapping/activity will accept: it needs a score to
 *  divide up, and a score category for the mapping's own foreign key. */
async function mappableActivity(score_number = 20) {
  const course = await createCourse();
  const weight = await createScoreWeight({ section_id: course.section_id });
  const activity = await createActivity({
    section_id: course.section_id,
    score_number,
  });

  return prisma.activities.update({
    where: { id: activity.id },
    data: { score_ratio_id: weight.score_ratio_id },
  });
}

describe("POST /mapping/activity", () => {
  it("rejects a request with no session", async () => {
    const activity = await mappableActivity();
    const clo = await createCLO({ section_id: activity.section_id! });

    const response = await request(app)
      .post("/mapping/activity")
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(401);
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await mappableActivity();
    const clo = await createCLO({ section_id: activity.section_id! });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(403);
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("maps the activity to the CLO and works out what it is worth", async () => {
    const teacher = await createTeacher();
    const activity = await mappableActivity(20);
    const clo = await createCLO({ section_id: activity.section_id! });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 25 });

    expect(response.status).toBe(200);

    const mapping = await prisma.activity_clo_mapping.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(mapping).toMatchObject({
      activity_id: activity.id,
      clo_id: clo.clo_id,
      weight: 25,
      sequence_order: 1,
      score_ratio_id: activity.score_ratio_id,
    });
    // A quarter of a twenty-mark activity.
    expect(Number(mapping.score)).toBe(5);
  });

  it("answers the created row, all ten columns of it", async () => {
    // The created row is the response, which #68 wrote down as
    // ActivityCLOMapping rather than the `{ id: number }` the frontend had
    // declared over it. `detail` is in the list and always null: nothing in
    // the system writes that column.
    const teacher = await createTeacher();
    const activity = await mappableActivity();
    const clo = await createCLO({ section_id: activity.section_id! });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 25 });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual([
      "activity_id",
      "clo_id",
      "created_at",
      "detail",
      "id",
      "score",
      "score_ratio_id",
      "sequence_order",
      "updated_at",
      "weight",
    ]);
    expect(typeof response.body.data.created_at).toBe("string");
  });

  it("sends the share of the mark back as a number", async () => {
    // activity_clo_mapping.score is Decimal(5,2) and the whole created row is
    // the response, so the score used to leave as the string "2.5" (#33).
    const teacher = await createTeacher();
    const activity = await mappableActivity(10);
    const clo = await createCLO({ section_id: activity.section_id! });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 25 });

    expect(response.status).toBe(200);
    expect(response.body.data.score).toBe(2.5);
  });

  it("numbers the next mapping after the ones already there", async () => {
    const teacher = await createTeacher();
    const activity = await mappableActivity();
    const first = await createCLO({ section_id: activity.section_id! });
    const second = await createCLO({ section_id: activity.section_id! });
    await mapActivityToCLO({ activity_id: activity.id, clo_id: first.clo_id });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: second.clo_id, weight: 50 });

    expect(response.status).toBe(200);
    expect(response.body.data.sequence_order).toBe(2);

    const mappings = await prisma.activity_clo_mapping.findMany({
      where: { activity_id: activity.id },
      orderBy: { sequence_order: "asc" },
    });
    expect(mappings.map((row) => row.clo_id)).toEqual([
      first.clo_id,
      second.clo_id,
    ]);
  });

  it("answers 404 for an activity that does not exist", async () => {
    // The activity is what the request is about — the mapping is added to it,
    // and clo_id is the value it points at — so an id matching nothing is the
    // 404 of ADR-0012, not the 400 that a body value naming nothing gets.
    const teacher = await createTeacher();
    const clo = await createCLO({
      section_id: (await createCourse()).section_id,
    });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: 999_999, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบกิจกรรมที่ต้องการ",
    });
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: 999_999 },
      }),
    ).toBe(0);
  });

  it("answers 400 for an activity that carries no score", async () => {
    // There is nothing to divide between CLOs. score_number defaults to 0, so
    // an activity nobody has given a mark to reaches here worth zero rather
    // than null — both are refused, and the same sentence covers both.
    const teacher = await createTeacher();
    const activity = await mappableActivity(0);
    const clo = await createCLO({ section_id: activity.section_id ?? 0 });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "กิจกรรมนี้ยังไม่มีคะแนนให้แบ่งตามผลการเรียนรู้",
    });
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("answers 400 for an activity with no score category", async () => {
    // score_ratio_id is NOT NULL here with a real foreign key, and the service
    // used to fall back to 0 when the activity had no category — an id no row
    // ever has, so Postgres refused it and the caller was told the server had
    // failed. The request is well formed; what is missing is a fact in the
    // database. ADR-0015 settles that on 400 — not 403, since no right is being
    // refused, and not 404, since the row is there (#43).
    const teacher = await createTeacher();
    const course = await createCourse();
    const activity = await createActivity({
      section_id: course.section_id,
      score_number: 20,
    });
    const clo = await createCLO({ section_id: course.section_id });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน",
    });
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("names the missing category first when both are missing", async () => {
    // An activity can lack a category and a score at once, and the two
    // refusals read differently. The category is asked about first, so the
    // order is worth standing on rather than leaving to whoever edits next.
    const teacher = await createTeacher();
    const course = await createCourse();
    const activity = await createActivity({
      section_id: course.section_id,
      score_number: 0,
    });
    const clo = await createCLO({ section_id: course.section_id });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "กิจกรรมนี้ยังไม่ได้เลือกประเภทสัดส่วนคะแนน",
    });
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("answers 400 when the mapping says nothing about what it is worth", async () => {
    // weight went straight into an arithmetic expression, so a request without
    // one produced a NaN score that Postgres refused.
    const teacher = await createTeacher();
    const activity = await mappableActivity();
    const clo = await createCLO({ section_id: activity.section_id! });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "weight", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("answers 400 for a weight that is not a number", async () => {
    const teacher = await createTeacher();
    const activity = await mappableActivity();
    const clo = await createCLO({ section_id: activity.section_id! });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: "ครึ่ง" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "weight", location: "body", message: "ต้องเป็นตัวเลข" },
    ]);
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });
});

describe("GET /mapping/activity", () => {
  it("returns the activities a CLO is measured by", async () => {
    const course = await createCourse();
    const clo = await createCLO({ section_id: course.section_id });
    const activity = await createActivity({
      section_id: course.section_id,
      activity_name: "รายงานบทที่ 1",
    });
    await createActivityRubric({
      activity_id: activity.id,
      levels: [
        { level_no: 1, description: "ยังไม่ถูกต้อง" },
        { level_no: 2, description: "ถูกต้องบางส่วน" },
        { level_no: 3, description: "ถูกต้องครบถ้วน" },
      ],
    });
    await mapActivityToCLO({
      activity_id: activity.id,
      clo_id: clo.clo_id,
      weight: 40,
    });
    // Another CLO's work, which must not show up here.
    await mapActivityToCLO();

    // No cookie, because the route asks for none — GET is `validate` only
    // where POST is `requireRole("TEACHER")`. Nothing on the student's side
    // reads it: the CLO table on the course page reads GET /course/clo, and
    // the only caller of this one is the teacher's mapping screen (#68).
    const response = await request(app)
      .get("/mapping/activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: activity.id,
        activity_name: "รายงานบทที่ 1",
        weight: 40,
        // How many levels the activity's rubric has, taken from the first
        // criterion only.
        level_no: 3,
      }),
    ]);
  });

  it("sends four columns off the activity, and the two beside them", async () => {
    // Until #68 the query had no `select` and answered all sixteen columns of
    // `activities` — `activity_type` among them, which this endpoint sends as
    // the column stores it, lower case, where GET /activity upper-cases on the
    // way out. The card reads a name, a description and the level it aims at,
    // and nothing else ever did (ADR-0044 §1, ADR-0047).
    const course = await createCourse();
    const clo = await createCLO({ section_id: course.section_id });
    const activity = await createActivity({ section_id: course.section_id });
    await mapActivityToCLO({ activity_id: activity.id, clo_id: clo.clo_id });

    const response = await request(app)
      .get("/mapping/activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data[0]).sort()).toEqual([
      "activity_name",
      "detail",
      "expected_level",
      "id",
      "level_no",
      "weight",
    ]);
  });

  it("returns level_no null for an activity with no rubric", async () => {
    // This used to answer with the highest level number in the whole table,
    // because the aggregate was filtered by an undefined rubric id and Prisma
    // reads that as no filter at all. See BEHAVIOR-CHANGES.md.
    const course = await createCourse();
    const clo = await createCLO({ section_id: course.section_id });
    const activity = await createActivity({ section_id: course.section_id });
    await createActivityRubric(); // somebody else's rubric, four levels deep
    await mapActivityToCLO({ activity_id: activity.id, clo_id: clo.clo_id });

    const response = await request(app)
      .get("/mapping/activity")
      .query({ clo_id: clo.clo_id });

    expect(response.body.data[0].level_no).toBeNull();
  });

  it("returns an empty list for a CLO nothing measures", async () => {
    const clo = await createCLO({
      section_id: (await createCourse()).section_id,
    });

    const response = await request(app)
      .get("/mapping/activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 400 when clo_id is missing", async () => {
    // This used to be a 200 with an empty list: NaN reached Prisma as null, and
    // clo_id is nullable here, so it asked for the mappings that point at no CLO
    // at all — an answer indistinguishable from a CLO nothing measures.
    await mapActivityToCLO();

    const response = await request(app).get("/mapping/activity");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: clo_id ต้องระบุ",
      errors: [{ field: "clo_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /mapping/activity/validate", () => {
  it("answers true once the activity is mapped to something", async () => {
    const mapping = await mapActivityToCLO();

    const response = await request(app)
      .get("/mapping/activity/validate")
      .query({ activity_id: mapping.activity_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toBe(true);
  });

  it("answers false for an activity that is mapped to nothing", async () => {
    const activity = await createActivity();

    const response = await request(app)
      .get("/mapping/activity/validate")
      .query({ activity_id: activity.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toBe(false);
  });

  it("answers 400 when activity_id is missing", async () => {
    // activity_id is NOT NULL on this table, so the null a missing parameter
    // used to turn into was not something the column could be compared against.
    const response = await request(app).get("/mapping/activity/validate");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "activity_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});

describe("POST /mapping/learning-activity", () => {
  it("rejects a request with no session", async () => {
    // This endpoint had no middleware on it at all, while the activity half of
    // the same screen was a teacher's. See BEHAVIOR-CHANGES.md.
    const activity = await createLearningActivity();
    const clo = await createCLO({ section_id: activity.section_id });

    const response = await request(app)
      .post("/mapping/learning-activity")
      .send({ learning_activity_id: activity.id, clo_id: clo.clo_id });

    expect(response.status).toBe(401);
    expect(
      await prisma.learning_activity_clo_mapping.count({
        where: { learning_activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await createLearningActivity();
    const clo = await createCLO({ section_id: activity.section_id });

    const response = await request(app)
      .post("/mapping/learning-activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({ learning_activity_id: activity.id, clo_id: clo.clo_id });

    expect(response.status).toBe(403);
    expect(
      await prisma.learning_activity_clo_mapping.count({
        where: { learning_activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("maps the learning activity to the CLO", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity();
    const clo = await createCLO({ section_id: activity.section_id });

    const response = await request(app)
      .post("/mapping/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ learning_activity_id: activity.id, clo_id: clo.clo_id });

    expect(response.status).toBe(200);

    const mapping =
      await prisma.learning_activity_clo_mapping.findUniqueOrThrow({
        where: { id: response.body.data.id },
      });
    expect(mapping).toMatchObject({
      learning_activity_id: activity.id,
      clo_id: clo.clo_id,
      sequence_order: 1,
    });
  });

  it("answers the created row, all six columns of it", async () => {
    // Six against the activity half's ten: a learning activity is not marked,
    // so its mapping has no weight, no cached score and no score category to
    // point at (#68).
    const teacher = await createTeacher();
    const activity = await createLearningActivity();
    const clo = await createCLO({ section_id: activity.section_id });

    const response = await request(app)
      .post("/mapping/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ learning_activity_id: activity.id, clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual([
      "clo_id",
      "created_at",
      "id",
      "learning_activity_id",
      "sequence_order",
      "updated_at",
    ]);
    expect(typeof response.body.data.updated_at).toBe("string");
  });

  it("numbers the next mapping after the ones already there", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity();
    const first = await createCLO({ section_id: activity.section_id });
    const second = await createCLO({ section_id: activity.section_id });
    await mapLearningActivityToCLO({
      learning_activity_id: activity.id,
      clo_id: first.clo_id,
    });

    const response = await request(app)
      .post("/mapping/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ learning_activity_id: activity.id, clo_id: second.clo_id });

    expect(response.status).toBe(200);
    expect(response.body.data.sequence_order).toBe(2);
    expect(
      await prisma.learning_activity_clo_mapping.count({
        where: { learning_activity_id: activity.id },
      }),
    ).toBe(2);
  });

  it("fails for a learning activity that does not exist", async () => {
    // Still a 500. The row is written straight out, so what refuses it is the
    // foreign key — P2003, not the P2025 #42 mapped onto 404. A foreign key
    // says a value in the body names nothing, which is a different answer
    // again, and #42 leaves it out of scope rather than guess at it.
    //
    // Since #43 it is also the file's one remaining 500, so it is where the
    // shape of an unexpected failure is asserted: the caller is told the server
    // failed and nothing else. Prisma's message names the table and the
    // constraint, and used to be forwarded verbatim.
    const teacher = await createTeacher();
    const clo = await createCLO({
      section_id: (await createCourse()).section_id,
    });

    const response = await request(app)
      .post("/mapping/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ learning_activity_id: 999_999, clo_id: clo.clo_id });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "เกิดข้อผิดพลาดภายในระบบ",
    });
    expect(
      await prisma.learning_activity_clo_mapping.count({
        where: { learning_activity_id: 999_999 },
      }),
    ).toBe(0);
  });

  it("answers 400 when the mapping names no CLO", async () => {
    // clo_id is nullable on this table, so a mapping that measures nothing used
    // to be written and answered with a 200.
    const teacher = await createTeacher();
    const activity = await createLearningActivity();

    const response = await request(app)
      .post("/mapping/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ learning_activity_id: activity.id });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "clo_id", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.learning_activity_clo_mapping.count({
        where: { learning_activity_id: activity.id },
      }),
    ).toBe(0);
  });
});

describe("GET /mapping/learning-activity", () => {
  it("returns the learning activities a CLO is measured by", async () => {
    const course = await createCourse();
    const clo = await createCLO({ section_id: course.section_id });
    const activity = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_name: "ใบงานที่ 1",
    });
    await mapLearningActivityToCLO({
      learning_activity_id: activity.id,
      clo_id: clo.clo_id,
    });
    // Another CLO's work, which must not show up here.
    await mapLearningActivityToCLO();

    const response = await request(app)
      .get("/mapping/learning-activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: activity.id,
        learning_activity_name: "ใบงานที่ 1",
      }),
    ]);
  });

  it("sends three columns off the learning activity, and no others", async () => {
    // The twin of the case in GET /mapping/activity, and one column narrower:
    // there is no expected level to draw, because a learning activity has no
    // rubric and no mark (ADR-0047).
    const course = await createCourse();
    const clo = await createCLO({ section_id: course.section_id });
    const activity = await createLearningActivity({
      section_id: course.section_id,
    });
    await mapLearningActivityToCLO({
      learning_activity_id: activity.id,
      clo_id: clo.clo_id,
    });

    const response = await request(app)
      .get("/mapping/learning-activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data[0]).sort()).toEqual([
      "detail",
      "id",
      "learning_activity_name",
    ]);
  });

  it("returns an empty list for a CLO nothing measures", async () => {
    const clo = await createCLO({
      section_id: (await createCourse()).section_id,
    });

    const response = await request(app)
      .get("/mapping/learning-activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 400 when clo_id is missing", async () => {
    await mapLearningActivityToCLO();

    const response = await request(app).get("/mapping/learning-activity");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "clo_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});
