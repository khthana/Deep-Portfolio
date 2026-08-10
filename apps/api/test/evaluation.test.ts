import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import {
  createActivity,
  createCourse,
  createLearningActivity,
  createLearningSubmission,
  createStudent,
  createSubmission,
  createTeacher,
  enrolStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * What a student is told about their own marks — GET /evaluation/list.
 *
 * The one endpoint a student uses to see how they are doing. It is built on
 * top of the teacher's `/gradebook/per-activity`, so each row carries both the
 * student's own mark and the class statistics for that piece of work — the
 * point of the view is where you stand, not just what you got.
 *
 * Two gates decide what appears. The student must have a submission row for
 * the work, and the work's announcement date must have passed; a piece of work
 * with no announcement date at all never passes the second gate, which is the
 * behaviour the "never announced" case is about. The student is taken from the
 * session, never from the query, so there is nothing to pass to read someone
 * else's marks.
 */

const DAY = 24 * 60 * 60 * 1000;
const announced = () => new Date(Date.now() - DAY);
const notYetAnnounced = () => new Date(Date.now() + DAY);

/** A student enrolled in a section, ready to be given work. */
async function enrolledStudent() {
  const course = await createCourse();
  const student = await createStudent();
  await enrolStudent(course.section_id, student.student_id);

  return { course, student };
}

describe("GET /evaluation/list", () => {
  it("lists an announced activity with the student's mark and the class spread", async () => {
    const { course, student } = await enrolledStudent();
    const classmate = await createStudent();
    await enrolStudent(course.section_id, classmate.student_id);
    const activity = await createActivity({
      section_id: course.section_id,
      score_number: 20,
      announcement_date: announced(),
    });
    const submission = await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "GRADED",
      score: 12,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: classmate.student_id,
      status: "GRADED",
      score: 18,
    });

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    // A Decimal serialises to a JSON string if it is handed to res.json as it
    // comes out of Prisma, which is what this used to do — so the score
    // arrived as "12" while both the response type and the frontend's copy of
    // it said number. It is converted now, like every other score in the API.
    expect(response.body.data.evaluations).toEqual([
      {
        id: submission.id,
        activity_id: activity.id,
        activity_name: activity.activity_name,
        deadline_date: null,
        full_score: 20,
        max_score: 18,
        min_score: 12,
        mean_score: 15,
        submitted_count: 2,
        not_submitted_count: 0,
        graded_count: 2,
        score: 12,
        status: "GRADED",
        type: "activity",
      },
    ]);
  });

  it("leaves the class spread empty until somebody has been marked", async () => {
    // The statistics come from the teacher's view, so #28 arrives here too: a
    // student whose work is announced but not yet marked used to be shown a
    // class max, min and mean of 0, which reads as everyone scoring nothing.
    const { course, student } = await enrolledStudent();
    const activity = await createActivity({
      section_id: course.section_id,
      score_number: 20,
      announcement_date: announced(),
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "SUBMITTED",
    });

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.evaluations[0]).toMatchObject({
      full_score: 20,
      max_score: null,
      min_score: null,
      mean_score: null,
      submitted_count: 1,
      graded_count: 0,
      score: null,
      status: "SUBMITTED",
    });
  });

  it("shows each student their own mark", async () => {
    const { course, student } = await enrolledStudent();
    const classmate = await createStudent();
    await enrolStudent(course.section_id, classmate.student_id);
    const activity = await createActivity({
      section_id: course.section_id,
      announcement_date: announced(),
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "GRADED",
      score: 3,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: classmate.student_id,
      status: "GRADED",
      score: 9,
    });

    for (const { caller, expected } of [
      { caller: student.student_id, expected: 3 },
      { caller: classmate.student_id, expected: 9 },
    ]) {
      const response = await request(app)
        .get("/evaluation/list")
        .set("Cookie", sessionCookie({ userId: caller }))
        .query({ section_id: course.section_id });

      expect(response.status).toBe(200);
      expect(response.body.data.evaluations[0].score).toBe(expected);
    }
  });

  it("hides work whose announcement date has not arrived", async () => {
    const { course, student } = await enrolledStudent();
    const activity = await createActivity({
      section_id: course.section_id,
      announcement_date: notYetAnnounced(),
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "GRADED",
      score: 7,
    });

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.evaluations).toEqual([]);
  });

  it("hides work that was never given an announcement date", async () => {
    // Recorded, not endorsed. An absent announcement date is read as "not
    // announced yet" rather than "announced from the start", so a teacher who
    // never filled the field in — it is optional everywhere else, and
    // createActivity leaves it out — marks work the student is never shown.
    // #29 decides what an absent date means.
    const { course, student } = await enrolledStudent();
    const activity = await createActivity({ section_id: course.section_id });
    await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "GRADED",
      score: 7,
    });

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.evaluations).toEqual([]);
  });

  it("leaves out work the student has no submission row for", async () => {
    const { course, student } = await enrolledStudent();
    await createActivity({
      section_id: course.section_id,
      announcement_date: announced(),
    });

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.evaluations).toEqual([]);
  });

  it("lists classroom work as well, without a score", async () => {
    const { course, student } = await enrolledStudent();
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
      announcement_date: announced(),
    });
    const submission = await createLearningSubmission({
      learning_activity_id: learningActivity.id,
      student_id: student.student_id,
      status: "SUBMITTED",
    });

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    // There is no score column on classroom work, so the row carries none of
    // the statistics an activity row does — only what was handed in and when.
    expect(response.body.data.evaluations).toEqual([
      {
        id: submission.id,
        activity_id: learningActivity.id,
        activity_name: learningActivity.learning_activity_name,
        status: "SUBMITTED",
        type: "learning_activity",
      },
    ]);
  });

  it("puts the marked work first and the classroom work after it", async () => {
    const { course, student } = await enrolledStudent();
    const activity = await createActivity({
      section_id: course.section_id,
      announcement_date: announced(),
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "GRADED",
      score: 4,
    });
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
      announcement_date: announced(),
    });
    await createLearningSubmission({
      learning_activity_id: learningActivity.id,
      student_id: student.student_id,
      status: "SUBMITTED",
    });

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(
      response.body.data.evaluations.map((row: { type: string }) => row.type),
    ).toEqual(["activity", "learning_activity"]);
  });

  it("refuses a request with no session", async () => {
    const course = await createCourse();

    const response = await request(app)
      .get("/evaluation/list")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a teacher", async () => {
    const course = await createCourse();
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
  });

  it("answers 400 when the section_id is missing", async () => {
    // parseInt(undefined) was NaN, which Prisma sends as null, and
    // learning_activities.section_id is NOT NULL. The activity half of the
    // answer survived it — activities.section_id is nullable — so the request
    // got as far as the classroom-work query before failing.
    const student = await createStudent();

    const response = await request(app)
      .get("/evaluation/list")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});
