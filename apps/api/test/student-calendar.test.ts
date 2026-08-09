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
import { BASELINE } from "./seed";
import { sessionCookie } from "./helpers/session";
import { enrolledCourse, FAR_FUTURE, TERM } from "./helpers/classroom";

/**
 * The student's calendar — GET /student/calendar.
 *
 * One handler, but the widest read in the group: it starts from the courses the
 * student is enrolled in for a given term, then collects every piece of work in
 * those sections and every timetabled class, and returns the three as one
 * object the calendar page lays out by date.
 *
 * The rule that shapes most of these cases is the announcement date. A piece of
 * work the teacher has not announced yet is not the student's business, so it
 * is left out of the calendar until announcement_date has passed — see
 * `checkIsOverAnnouncementDate`. Work that was never given one stays hidden
 * forever, which is #15's note, not this ticket's.
 */

describe("GET /student/calendar", () => {
  it("returns the student's classes and announced work for the term", async () => {
    const student = await createStudent();
    const course = await enrolledCourse(student.student_id, {
      subject_name_en: "Software Engineering",
      schedule: {
        day_of_week: "WED",
        start_time: "13:00",
        end_time: "16:00",
        classroom: "ECC-505",
      },
    });

    const activity = await createActivity({
      section_id: course.section_id,
      activity_name: "งานที่หนึ่ง",
      activity_type: "individual",
      announcement_date: new Date("2020-01-01T00:00:00Z"),
      deadline_date: FAR_FUTURE,
    });
    const submission = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_name: "กิจกรรมที่หนึ่ง",
      learning_activity_type: "individual",
      announcement_date: new Date("2020-01-01T00:00:00Z"),
      deadline_date: FAR_FUTURE,
    });
    const learningSubmission = await createLearningSubmission({
      student_id: student.student_id,
      learning_activity_id: learningActivity.id,
      status: "SUBMITTED",
    });

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query(TERM);

    expect(response.status).toBe(200);
    expect(response.body.data.activities).toEqual([
      {
        id: submission.id,
        name: "งานที่หนึ่ง",
        deadline_date: FAR_FUTURE.toISOString(),
        type: "individual",
        status: "NOT_SUBMITTED",
        course: "Software Engineering",
      },
    ]);
    expect(response.body.data.learning_activities).toEqual([
      {
        id: learningSubmission.id,
        name: "กิจกรรมที่หนึ่ง",
        deadline_date: FAR_FUTURE.toISOString(),
        type: "individual",
        status: "SUBMITTED",
        course: "Software Engineering",
      },
    ]);
    // One entry per timetabled slot, carrying what the week view needs to place
    // it: the day, the two times as "HH:MM", and the room.
    expect(response.body.data.courses).toEqual([
      {
        id: course.section_id,
        name: "Software Engineering",
        day_of_week: "WED",
        start_time: "13:00",
        end_time: "16:00",
        classroom: "ECC-505",
      },
    ]);
  });

  it("leaves out work whose announcement date has not arrived", async () => {
    // See BEHAVIOR-CHANGES.md. Unannounced work used to come back as the
    // literal `false` — one per hidden item, in an array the response type
    // says holds events — rather than being dropped.
    const student = await createStudent();
    const course = await enrolledCourse(student.student_id);

    const announced = await createActivity({
      section_id: course.section_id,
      announcement_date: new Date("2020-01-01T00:00:00Z"),
      deadline_date: FAR_FUTURE,
    });
    const visible = await createSubmission({
      student_id: student.student_id,
      activity_id: announced.id,
    });

    const unannounced = await createActivity({
      section_id: course.section_id,
      announcement_date: FAR_FUTURE,
      deadline_date: FAR_FUTURE,
    });
    await createSubmission({
      student_id: student.student_id,
      activity_id: unannounced.id,
    });

    const hiddenLearning = await createLearningActivity({
      section_id: course.section_id,
      announcement_date: FAR_FUTURE,
    });
    await createLearningSubmission({
      student_id: student.student_id,
      learning_activity_id: hiddenLearning.id,
    });

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query(TERM);

    expect(response.status).toBe(200);
    expect(response.body.data.activities).toHaveLength(1);
    expect(response.body.data.activities[0].id).toBe(visible.id);
    expect(response.body.data.learning_activities).toEqual([]);
  });

  it("leaves out work that was never given an announcement date", async () => {
    // Nothing announces it, so nothing ever reveals it — the student cannot
    // see this piece of work in the calendar at all. #15 recorded that as a
    // defect of the announcement rule rather than of the calendar.
    const student = await createStudent();
    const course = await enrolledCourse(student.student_id);

    const activity = await createActivity({ section_id: course.section_id });
    await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
    });

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query(TERM);

    expect(response.body.data.activities).toEqual([]);
  });

  it("leaves out a section nobody teaches, and its work with it", async () => {
    // Not a rule about the calendar — the whole course list is built through
    // getCourseDetail, which has nothing to say about a section with no
    // teacher and returns null. The work in that section disappears as a
    // consequence, which is the part a student would notice.
    const student = await createStudent();
    const course = await createCourse({ schedule: {} });
    await enrolStudent(course.section_id, student.student_id);

    const activity = await createActivity({
      section_id: course.section_id,
      announcement_date: new Date("2020-01-01T00:00:00Z"),
    });
    await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
    });

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query(TERM);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      activities: [],
      learning_activities: [],
      courses: [],
    });
  });

  it("leaves out another student's work in the same section", async () => {
    const student = await createStudent();
    const classmate = await createStudent();
    const course = await enrolledCourse(student.student_id);
    await enrolStudent(course.section_id, classmate.student_id);

    const activity = await createActivity({
      section_id: course.section_id,
      announcement_date: new Date("2020-01-01T00:00:00Z"),
    });
    const mine = await createSubmission({
      student_id: student.student_id,
      activity_id: activity.id,
    });
    await createSubmission({
      student_id: classmate.student_id,
      activity_id: activity.id,
    });

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query(TERM);

    expect(
      response.body.data.activities.map((a: { id: number }) => a.id),
    ).toEqual([mine.id]);
  });

  it("leaves out courses from another term", async () => {
    const student = await createStudent();
    const thisTerm = await enrolledCourse(student.student_id, { schedule: {} });
    await enrolledCourse(student.student_id, {
      ...BASELINE.previousTerm,
      schedule: {},
    });

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query(TERM);

    expect(
      response.body.data.courses.map((c: { id: number }) => c.id),
    ).toEqual([thisTerm.section_id]);
  });

  it("returns three empty lists for a student enrolled in nothing", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query(TERM);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      activities: [],
      learning_activities: [],
      courses: [],
    });
  });

  it("reads the student from the session, not from the query", async () => {
    // The only endpoints in this group that cannot be asked about somebody
    // else are the ones that take the id from the cookie. Passing a classmate's
    // id changes nothing.
    const student = await createStudent();
    const classmate = await createStudent();
    await enrolledCourse(classmate.student_id);

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ ...TERM, student_id: classmate.student_id });

    expect(response.body.data.courses).toEqual([]);
  });

  it("refuses a request with no session", async () => {
    const response = await request(app).get("/student/calendar").query(TERM);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a teacher", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query(TERM);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะนักศึกษาเท่านั้น",
    });
  });

  it("answers 400 for a request that names no term", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/student/calendar")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "semester", location: "query", message: "ต้องระบุ" },
      { field: "academic_year", location: "query", message: "ต้องระบุ" },
    ]);
  });
});
