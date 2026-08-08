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

  it("fails for an activity that does not exist", async () => {
    const teacher = await createTeacher();
    const clo = await createCLO({ section_id: (await createCourse()).section_id });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: 999_999, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(500);
  });

  it("refuses an activity that carries no score", async () => {
    // Worth knowing why: the service tests `!activity.score_number`, so an
    // activity worth nothing is reported as an activity that does not exist.
    // The message is wrong but the refusal is right — there is no score to
    // divide between CLOs.
    const teacher = await createTeacher();
    const activity = await mappableActivity(0);
    const clo = await createCLO({ section_id: activity.section_id ?? 0 });

    const response = await request(app)
      .post("/mapping/activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ activity_id: activity.id, clo_id: clo.clo_id, weight: 100 });

    expect(response.status).toBe(500);
    expect(
      await prisma.activity_clo_mapping.count({
        where: { activity_id: activity.id },
      }),
    ).toBe(0);
  });

  it("fails when the activity has no score category", async () => {
    // Recorded, not endorsed. score_ratio_id is NOT NULL with a real foreign
    // key, and the service falls back to 0 when the activity has no category —
    // an id no row ever has, so Postgres refuses it and the caller gets a 500
    // that says nothing about the actual problem. Request validation is
    // issue #20.
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

    expect(response.status).toBe(500);
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

    // No cookie: the student's outcome page reads this.
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
    const clo = await createCLO({ section_id: (await createCourse()).section_id });

    const response = await request(app)
      .get("/mapping/activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("returns an empty list when clo_id is missing", async () => {
    // NaN reaches Prisma as null, and clo_id is nullable here, so this asks for
    // the mappings that point at no CLO at all rather than failing. Recorded,
    // not endorsed — issue #20.
    await mapActivityToCLO();

    const response = await request(app).get("/mapping/activity");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
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

  it("fails when activity_id is missing", async () => {
    // activity_id is NOT NULL on this table, so the null a missing parameter
    // turns into is not something the column can be compared against.
    const response = await request(app).get("/mapping/activity/validate");

    expect(response.status).toBe(500);
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

    const mapping = await prisma.learning_activity_clo_mapping.findUniqueOrThrow(
      { where: { id: response.body.data.id } },
    );
    expect(mapping).toMatchObject({
      learning_activity_id: activity.id,
      clo_id: clo.clo_id,
      sequence_order: 1,
    });
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
    const teacher = await createTeacher();
    const clo = await createCLO({ section_id: (await createCourse()).section_id });

    const response = await request(app)
      .post("/mapping/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ learning_activity_id: 999_999, clo_id: clo.clo_id });

    expect(response.status).toBe(500);
    expect(
      await prisma.learning_activity_clo_mapping.count({
        where: { learning_activity_id: 999_999 },
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

  it("returns an empty list for a CLO nothing measures", async () => {
    const clo = await createCLO({ section_id: (await createCourse()).section_id });

    const response = await request(app)
      .get("/mapping/learning-activity")
      .query({ clo_id: clo.clo_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("returns an empty list when clo_id is missing", async () => {
    await mapLearningActivityToCLO();

    const response = await request(app).get("/mapping/learning-activity");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});
