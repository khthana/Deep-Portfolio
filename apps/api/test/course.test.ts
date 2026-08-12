import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { BASELINE } from "./seed";
import { createCourse, createTeacher, createUser } from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * The course endpoints, and the first test file written on top of the baseline
 * seed and the factories. It is here to prove that combination works against
 * the real schema — full coverage of course setup is a later ticket.
 *
 * Read any case below and the arrange step should tell you what it is about.
 * A course whose term is not named is in the current term; a teacher whose
 * name is not given has one; the reference data those hang off was already in
 * the database before the file started.
 */

describe("GET /course/list", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).get("/course/list");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    // A user with no roles at all: authenticated, but not authorised.
    const user = await createUser();

    const response = await request(app)
      .get("/course/list")
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });

  it("answers 400 when the term is not named", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/course/list")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "academic_year", location: "query", message: "ต้องระบุ" },
      { field: "semester", location: "query", message: "ต้องระบุ" },
    ]);
  });

  it("returns empty lists for a teacher who teaches nothing", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/course/list")
      .query(BASELINE.term)
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      teacher_id: teacher.user_id,
      active_courses: [],
      archived_courses: [],
    });
  });

  it("splits the teacher's sections by the term asked for", async () => {
    const teacher = await createTeacher();
    const thisTerm = await createCourse({ teacher_id: teacher.user_id });
    const lastTerm = await createCourse({
      teacher_id: teacher.user_id,
      ...BASELINE.previousTerm,
    });

    const response = await request(app)
      .get("/course/list")
      .query(BASELINE.term)
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data.active_courses).toEqual([
      expect.objectContaining({
        section_id: thisTerm.section_id,
        course_id: thisTerm.subject_id,
        academic_year: BASELINE.term.academic_year,
        semester: BASELINE.term.semester,
      }),
    ]);
    expect(response.body.data.archived_courses).toEqual([
      expect.objectContaining({
        section_id: lastTerm.section_id,
        academic_year: BASELINE.previousTerm.academic_year,
        semester: BASELINE.previousTerm.semester,
      }),
    ]);
  });

  it("returns only the sections this teacher is assigned to", async () => {
    const teacher = await createTeacher();
    const colleague = await createTeacher();
    const mine = await createCourse({ teacher_id: teacher.user_id });
    await createCourse({ teacher_id: colleague.user_id });

    const response = await request(app)
      .get("/course/list")
      .query(BASELINE.term)
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.body.data.active_courses.map((c: any) => c.section_id))
      .toEqual([mine.section_id]);
  });

  it("orders the active list by day of week, then by start time", async () => {
    const teacher = await createTeacher();

    for (const schedule of [
      { day_of_week: "WED", start_time: "09:00", end_time: "12:00" },
      { day_of_week: "MON", start_time: "13:00", end_time: "16:00" },
      { day_of_week: "MON", start_time: "09:00", end_time: "12:00" },
    ] as const) {
      await createCourse({ teacher_id: teacher.user_id, schedule });
    }

    const response = await request(app)
      .get("/course/list")
      .query(BASELINE.term)
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(
      response.body.data.active_courses.map((c: any) => [
        c.day_of_week,
        c.start_time,
      ]),
    ).toEqual([
      ["MON", "09:00"],
      ["MON", "13:00"],
      ["WED", "09:00"],
    ]);
  });
});

describe("GET /course", () => {
  it("returns the section, its subject, its teacher and its schedule", async () => {
    const teacher = await createTeacher({
      email: "preecha@example.test",
      phone: "021112222",
      title_th: "ผศ.ดร.",
      first_name_th: "ปรีชา",
      last_name_th: "วิชาการ",
      title_en: "Asst. Prof.",
      first_name_en: "Preecha",
      last_name_en: "Wichakan",
    });
    const course = await createCourse({
      teacher_id: teacher.user_id,
      section_number: "2",
      subject_name_th: "การออกแบบส่วนต่อประสาน",
      subject_name_en: "Interface Design",
      description_th: "หลักการออกแบบส่วนต่อประสานกับผู้ใช้",
      description_en: "Principles of user interface design.",
      credits: 4,
      schedule: {
        day_of_week: "THU",
        start_time: "13:00",
        end_time: "16:00",
        classroom: "ECC-505",
      },
    });

    // No cookie: this endpoint is open, and a student's course page reads it.
    const response = await request(app)
      .get("/course")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      teacher_name_th: "ผศ.ดร. ปรีชา วิชาการ",
      teacher_name_en: "Asst. Prof. Preecha Wichakan",
      teacher_email: "preecha@example.test",
      teacher_phone: "021112222",
      teacher_id: teacher.user_id,

      section_id: course.section_id,
      section_number: "2",

      course_name_th: "การออกแบบส่วนต่อประสาน",
      course_name_en: "Interface Design",
      course_id: course.subject_id,
      credits: 4,
      course_desc_th: "หลักการออกแบบส่วนต่อประสานกับผู้ใช้",
      course_desc_en: "Principles of user interface design.",

      academic_year: BASELINE.term.academic_year,
      semester: BASELINE.term.semester,
      program_id: BASELINE.program.program_id,

      day_of_week: "THU",
      start_time: "13:00",
      end_time: "16:00",
      classroom: "ECC-505",
    });
  });

  it("reports no course for a section that does not exist", async () => {
    const response = await request(app)
      .get("/course")
      .query({ section_id: 999_999 });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });

  it("answers 400 for a section id that is not a positive number", async () => {
    const response = await request(app).get("/course").query({ section_id: 0 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "section_id",
        location: "query",
        message: "ต้องมากกว่า 0",
      },
    ]);
  });

  it("returns a section with nobody teaching it, with the teacher unnamed", async () => {
    // See BEHAVIOR-CHANGES.md. The whole section used to come back as null
    // because the teacher lookup came back empty (#48) — a section waiting to
    // be staffed is ordinary, and the course exists either way.
    const orphan = await createCourse({
      section_number: "3",
      subject_name_th: "ระบบฐานข้อมูล",
      schedule: { day_of_week: "MON", start_time: "08:00", end_time: "10:00" },
    });

    const response = await request(app)
      .get("/course")
      .query({ section_id: orphan.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      section_id: orphan.section_id,
      section_number: "3",
      course_name_th: "ระบบฐานข้อมูล",
      day_of_week: "MON",
      start_time: "08:00",
      end_time: "10:00",

      teacher_id: null,
      teacher_name_th: null,
      teacher_name_en: null,
      teacher_email: null,
      teacher_phone: null,
    });
  });

  it("returns a section whose teacher is not a user, with the teacher unnamed", async () => {
    // course_sections_teacher.user_id has no foreign key to users, so "the
    // section has a teacher row" and "the section has a teacher" are different
    // questions. Both are answered with the same five nulls.
    const dangling = await createCourse({ teacher_id: "00000000" });

    const response = await request(app)
      .get("/course")
      .query({ section_id: dangling.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      section_id: dangling.section_id,

      teacher_id: null,
      teacher_name_th: null,
      teacher_name_en: null,
      teacher_email: null,
      teacher_phone: null,
    });
  });
});

describe("POST /course/schedule", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/course/schedule").send({});

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();

    const response = await request(app)
      .post("/course/schedule")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({
        section_id: course.section_id,
        day_of_week: "FRI",
        start_time: "10:00",
        end_time: "12:00",
        classroom: "ECC-303",
      });

    expect(response.status).toBe(403);
  });

  it("gives an unscheduled section a schedule", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/course/schedule")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        section_id: course.section_id,
        day_of_week: "FRI",
        start_time: "10:00",
        end_time: "12:00",
        classroom: "ECC-303",
      });

    expect(response.status).toBe(200);

    const detail = await request(app)
      .get("/course")
      .query({ section_id: course.section_id });

    expect(detail.body.data).toMatchObject({
      day_of_week: "FRI",
      start_time: "10:00",
      end_time: "12:00",
      classroom: "ECC-303",
    });
  });

  it("answers 400 for a day and a time it cannot read", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/course/schedule")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        section_id: course.section_id,
        day_of_week: "วันศุกร์",
        start_time: "10am",
        end_time: "12:00",
        classroom: "ECC-303",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "day_of_week",
        location: "body",
        message: "ต้องเป็นค่าใดค่าหนึ่งใน: MON, TUE, WED, THU, FRI, SAT, SUN",
      },
      {
        field: "start_time",
        location: "body",
        message: "ต้องเป็นเวลาตามรูปแบบ HH:MM",
      },
    ]);

    const schedules = await prisma.course_section_schedule.findMany({
      where: { section_id: course.section_id },
    });
    expect(schedules).toEqual([]);
  });

  it("moves the existing schedule rather than adding a second one", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({
      teacher_id: teacher.user_id,
      schedule: {
        day_of_week: "MON",
        start_time: "09:00",
        end_time: "12:00",
        classroom: "ECC-101",
      },
    });

    await request(app)
      .post("/course/schedule")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        section_id: course.section_id,
        day_of_week: "TUE",
        start_time: "14:00",
        end_time: "17:00",
        classroom: "ECC-202",
      });

    const schedules = await prisma.course_section_schedule.findMany({
      where: { section_id: course.section_id },
    });

    expect(schedules).toHaveLength(1);
    expect(schedules[0].day_of_week).toBe("TUE");
    expect(schedules[0].classroom).toBe("ECC-202");
  });
});
