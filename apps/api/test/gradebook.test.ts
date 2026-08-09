import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import {
  createActivity,
  createCourse,
  createStudent,
  createSubmission,
  createTeacher,
  enrolStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * The mark book — /gradebook.
 *
 * Two views of the same numbers. `/per-student` is a row per student with their
 * running total and a punctuality count; `/per-activity` is a row per piece of
 * work with the spread of the class across it. Both take a section and nothing
 * else, and both are for the teacher — which is why the caller of every case
 * here is one. Which teacher may see which section is still nobody's job to
 * decide, and is #30.
 *
 * Scores are Decimal(5,2) in the database — whole numbers of hundredths — and
 * ordinary doubles by the time they are added up, which is why the service does
 * its arithmetic in hundredths and why two cases here are about nothing else.
 * Nothing in this file compares a score with a tolerance: every expected value
 * is one that exact arithmetic produces, so an assertion needing a tolerance
 * would be hiding a real defect rather than accommodating floating point.
 */

/** A section with `count` students enrolled, one activity, and its teacher. */
async function classWithStudents(count: number, score_number: number) {
  const course = await createCourse();
  const teacher = await createTeacher();
  const students = [];
  for (let index = 0; index < count; index++) {
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);
    students.push(student);
  }
  const activity = await createActivity({
    section_id: course.section_id,
    score_number,
  });

  return { course, activity, students, teacher };
}

const HOUR = 60 * 60 * 1000;

describe("GET /gradebook/per-student", () => {
  it("reports each student's marks, counts and total", async () => {
    const { course, activity, students, teacher } = await classWithStudents(
      2,
      20,
    );
    const [marked, waiting] = students;
    await createSubmission({
      activity_id: activity.id,
      student_id: marked.student_id,
      status: "GRADED",
      score: 18.5,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: waiting.student_id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.section_id).toBe(course.section_id);
    expect(response.body.data.students).toEqual([
      {
        student_id: marked.student_id,
        student_name: marked.full_name_th,
        on_time_submissions: 1,
        late_submissions: 0,
        missing_submissions: 0,
        total_score: 18.5,
        activities: [
          {
            activity_id: activity.id,
            activity_name: activity.activity_name,
            full_score: 20,
            score: 18.5,
            status: "GRADED",
          },
        ],
      },
      {
        student_id: waiting.student_id,
        student_name: waiting.full_name_th,
        on_time_submissions: 0,
        late_submissions: 0,
        missing_submissions: 1,
        total_score: 0,
        activities: [
          {
            activity_id: activity.id,
            activity_name: activity.activity_name,
            full_score: 20,
            score: null,
            status: "NOT_SUBMITTED",
          },
        ],
      },
    ]);
  });

  it("counts a submission handed in after the deadline as late", async () => {
    const deadline = new Date("2026-03-01T00:00:00Z");
    const course = await createCourse();
    const teacher = await createTeacher();
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);
    const activity = await createActivity({
      section_id: course.section_id,
      deadline_date: deadline,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "SUBMITTED",
      submitted_at: new Date(deadline.getTime() + HOUR),
    });

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.students[0]).toMatchObject({
      late_submissions: 1,
      on_time_submissions: 0,
    });
  });

  it("keeps calling a late submission late after it has been marked", async () => {
    // The old condition reached the late branch only for status SUBMITTED, so
    // the same work handed in at the same moment was late until the teacher
    // opened it and on time afterwards. Punctuality is a fact about the dates.
    const deadline = new Date("2026-03-01T00:00:00Z");
    const course = await createCourse();
    const teacher = await createTeacher();
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);
    const activity = await createActivity({
      section_id: course.section_id,
      deadline_date: deadline,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: student.student_id,
      status: "GRADED",
      score: 5,
      submitted_at: new Date(deadline.getTime() + HOUR),
    });

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.students[0]).toMatchObject({
      late_submissions: 1,
      on_time_submissions: 0,
    });
  });

  it("counts work with no deadline as on time", async () => {
    const { course, activity, students, teacher } = await classWithStudents(
      1,
      20,
    );
    await createSubmission({
      activity_id: activity.id,
      student_id: students[0].student_id,
      status: "SUBMITTED",
    });

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.students[0]).toMatchObject({
      late_submissions: 0,
      on_time_submissions: 1,
    });
  });

  it("adds marks of 10 and 10.01 up to exactly 20.01", async () => {
    // Both marks are exact in the database — Decimal(5,2) holds 10.00 and 10.01
    // precisely — but as doubles they add up to 20.009999999999998, and that
    // whole thing used to reach the caller. The total is accumulated in
    // hundredths now, where 1000 + 1001 is exactly 2001 and there is no error
    // to discard afterwards.
    const course = await createCourse();
    const teacher = await createTeacher();
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);
    for (const score of [10, 10.01]) {
      const activity = await createActivity({ section_id: course.section_id });
      await createSubmission({
        activity_id: activity.id,
        student_id: student.student_id,
        status: "GRADED",
        score,
      });
    }

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.students[0].total_score).toBe(20.01);
  });

  it("leaves out a student who is not enrolled in the section", async () => {
    const { course, activity, teacher } = await classWithStudents(1, 20);
    const outsider = await createStudent();
    await createSubmission({
      activity_id: activity.id,
      student_id: outsider.student_id,
      status: "GRADED",
      score: 20,
    });

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(
      response.body.data.students.map(
        (student: { student_id: string }) => student.student_id,
      ),
    ).not.toContain(outsider.student_id);
  });

  it("returns an empty student list for a section with nobody in it", async () => {
    const course = await createCourse();
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      section_id: course.section_id,
      students: [],
    });
  });

  it("refuses a request with no session", async () => {
    const course = await createCourse();

    const response = await request(app)
      .get("/gradebook/per-student")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a student", async () => {
    const course = await createCourse();
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });

  it("answers 400 when the section_id is missing", async () => {
    // Number(undefined) was NaN, which Prisma sends as null, and
    // student_course.section_id is NOT NULL — so the query was rejected rather
    // than matching nothing.
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/gradebook/per-student")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});

describe("GET /gradebook/per-activity", () => {
  it("reports the spread of the class across each piece of work", async () => {
    const { course, activity, students, teacher } = await classWithStudents(
      3,
      20,
    );
    const [top, middle, absent] = students;
    await createSubmission({
      activity_id: activity.id,
      student_id: top.student_id,
      status: "GRADED",
      score: 18,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: middle.student_id,
      status: "GRADED",
      score: 12,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: absent.student_id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.activities).toEqual([
      {
        activity_id: activity.id,
        activity_name: activity.activity_name,
        deadline_date: null,
        full_score: 20,
        max_score: 18,
        min_score: 12,
        mean_score: 15,
        submitted_count: 2,
        not_submitted_count: 1,
        graded_count: 2,
      },
    ]);
  });

  it("averages over the marked submissions only, not the whole class", async () => {
    // A student who has handed in but not been marked has no score to average,
    // so they raise submitted_count without moving the mean.
    const { course, activity, students, teacher } = await classWithStudents(
      2,
      20,
    );
    await createSubmission({
      activity_id: activity.id,
      student_id: students[0].student_id,
      status: "GRADED",
      score: 16,
    });
    await createSubmission({
      activity_id: activity.id,
      student_id: students[1].student_id,
      status: "SUBMITTED",
    });

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.activities[0]).toMatchObject({
      mean_score: 16,
      submitted_count: 2,
      graded_count: 1,
    });
  });

  it("rounds the mean to the two decimal places a score is stored with", async () => {
    // 1 + 2 + 2 over three is 1.6666666666666667 as a double, and that whole
    // thing used to reach the caller — `/per-student` rounded its total and
    // this view did not, so the same column came back to two decimal places in
    // one and to seventeen in the other. The student's evaluation table renders
    // this number as it arrives.
    const { course, activity, students, teacher } = await classWithStudents(
      3,
      20,
    );
    for (const [index, score] of [1, 2, 2].entries()) {
      await createSubmission({
        activity_id: activity.id,
        student_id: students[index].student_id,
        status: "GRADED",
        score,
      });
    }

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.activities[0].mean_score).toBe(1.67);
  });

  it("rounds a mean that lands exactly halfway up, not down", async () => {
    // This is the case a mean has and a total does not. Marks of 1.00 and 1.01
    // average to 1.005, exactly between two hundredths — and rounding that as a
    // double answers 1.00, because the nearest double to 1.005 is a hair below
    // it. Averaging in hundredths instead makes the halfway point exact, so it
    // rounds up like every other halfway point.
    const { course, activity, students, teacher } = await classWithStudents(
      2,
      20,
    );
    for (const [index, score] of [1, 1.01].entries()) {
      await createSubmission({
        activity_id: activity.id,
        student_id: students[index].student_id,
        status: "GRADED",
        score,
      });
    }

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.activities[0].mean_score).toBe(1.01);
  });

  it("reports zero rather than nothing for work nobody has a mark for", async () => {
    // Recorded, not endorsed. max, min and mean all fall back to 0 when no one
    // has been marked, so an activity the whole class scored 0 on and one the
    // teacher has not opened yet are told apart only by graded_count. #28
    // reports null for a statistic there is nothing to compute — a change of
    // type, which is why it is not made here.
    const { course, activity, students, teacher } = await classWithStudents(
      1,
      20,
    );
    await createSubmission({
      activity_id: activity.id,
      student_id: students[0].student_id,
      status: "SUBMITTED",
    });

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data.activities[0]).toMatchObject({
      max_score: 0,
      min_score: 0,
      mean_score: 0,
      graded_count: 0,
    });
  });

  it("returns an empty activity list for a section with no work set", async () => {
    const course = await createCourse();
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      section_id: course.section_id,
      activities: [],
    });
  });

  it("refuses a request with no session", async () => {
    const course = await createCourse();

    const response = await request(app)
      .get("/gradebook/per-activity")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a student", async () => {
    const course = await createCourse();
    const student = await createStudent();
    await enrolStudent(course.section_id, student.student_id);

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ section_id: course.section_id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });

  it("answers 400 when the section_id is too large to be a section", async () => {
    // activities.section_id is an Int, so a number past what an Int holds was
    // rejected by Postgres before it reached the table. A fractional section_id
    // is a 400 for the same reason, where Prisma used to take 1.5 and answer as
    // though 1 had been asked for.
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ section_id: "99999999999" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "section_id",
        location: "query",
        message: "ต้องไม่เกิน 2147483647",
      },
    ]);
  });

  it("answers 400 for a request that names no section", async () => {
    // activities.section_id is nullable, so the NaN that Number(undefined)
    // produced was sent as null and matched the activities that belong to no
    // section instead of being rejected: a 200 whose section_id is null, where
    // the same omission on /per-student was a 500.
    const { teacher } = await classWithStudents(1, 20);

    const response = await request(app)
      .get("/gradebook/per-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});
