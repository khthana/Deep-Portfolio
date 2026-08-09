import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createActivity,
  createCourse,
  createCourseMaterial,
  createLearningActivity,
  createLessonPlan,
  createLinkAttachment,
  createTeacher,
  createUser,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * The weekly plan of a section — /lesson-plan.
 *
 * One row per week, and week_no is a plain column: nothing in the schema keeps
 * it unique or contiguous, so the endpoints maintain it by hand. DELETE
 * renumbers the survivors 1..n, which is the most interesting thing this group
 * does and the reason several cases below are about what a delete leaves
 * behind.
 *
 * /lesson-plan/student is the same plan seen from the student side: work that
 * has not been announced yet is left out of it, and the material attached to
 * each week is included.
 */

const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000);
const TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000);

describe("GET /lesson-plan", () => {
  it("returns the section's weeks in order, with the work planned in each", async () => {
    const course = await createCourse();
    const week1 = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
      title: "แนะนำรายวิชา",
      description: "ภาพรวมและเกณฑ์การประเมิน",
      remark: "อ่านเอกสารก่อนเข้าเรียน",
    });
    const week2 = await createLessonPlan({
      section_id: course.section_id,
      week_no: 2,
      title: "แบบจำลองข้อมูล",
    });
    await createActivity({
      section_id: course.section_id,
      course_syllabus_id: week2.id,
      activity_name: "การบ้านครั้งที่ 1",
    });
    await createLearningActivity({
      section_id: course.section_id,
      course_syllabus_id: week2.id,
      learning_activity_name: "อภิปรายกลุ่ม",
    });

    // No cookie: the teacher's plan page and the student's both read this.
    const response = await request(app)
      .get("/lesson-plan")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: week1.id,
        week_no: 1,
        title: "แนะนำรายวิชา",
        description: "ภาพรวมและเกณฑ์การประเมิน",
        remark: "อ่านเอกสารก่อนเข้าเรียน",
        allActivities: [],
      }),
      expect.objectContaining({
        id: week2.id,
        week_no: 2,
        title: "แบบจำลองข้อมูล",
        // Assignments first, then classroom activities — the endpoint
        // concatenates the two tables in that order.
        allActivities: ["การบ้านครั้งที่ 1", "อภิปรายกลุ่ม"],
      }),
    ]);
  });

  it("returns only this section's weeks", async () => {
    const course = await createCourse();
    const otherCourse = await createCourse();
    const mine = await createLessonPlan({ section_id: course.section_id });
    await createLessonPlan({ section_id: otherCourse.section_id });

    const response = await request(app)
      .get("/lesson-plan")
      .query({ section_id: course.section_id });

    expect(response.body.data.map((week: { id: number }) => week.id)).toEqual([
      mine.id,
    ]);
  });

  it("lists work that has not been announced yet", async () => {
    // The teacher's view shows everything planned. The student's view, below,
    // is the one that hides it.
    const course = await createCourse();
    const week = await createLessonPlan({ section_id: course.section_id });
    await createActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
      activity_name: "การบ้านที่ยังไม่ประกาศ",
      announcement_date: TOMORROW,
    });

    const response = await request(app)
      .get("/lesson-plan")
      .query({ section_id: course.section_id });

    expect(response.body.data[0].allActivities).toEqual([
      "การบ้านที่ยังไม่ประกาศ",
    ]);
  });

  it("answers 400 when section_id is missing", async () => {
    await createLessonPlan({ section_id: (await createCourse()).section_id });

    const response = await request(app).get("/lesson-plan");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: section_id ต้องระบุ",
      errors: [
        { field: "section_id", location: "query", message: "ต้องระบุ" },
      ],
    });
  });
});

describe("POST /lesson-plan", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/lesson-plan").send({});

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
      .post("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({
        week_no: 1,
        title: "แนะนำรายวิชา",
        section_id: course.section_id,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });

    const stored = await prisma.course_syllabus.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toEqual([]);
  });

  it("adds a week and returns its id", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        week_no: 1,
        title: "แนะนำรายวิชา",
        description: "ภาพรวมและเกณฑ์การประเมิน",
        remark: "อ่านเอกสารก่อนเข้าเรียน",
        created_by: teacher.user_id,
        section_id: course.section_id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      lesson_plan_id: expect.any(Number),
    });

    const stored = await prisma.course_syllabus.findUnique({
      where: { id: response.body.data.lesson_plan_id },
    });
    expect(stored).toMatchObject({
      week_no: 1,
      title: "แนะนำรายวิชา",
      description: "ภาพรวมและเกณฑ์การประเมิน",
      remark: "อ่านเอกสารก่อนเข้าเรียน",
      created_by: teacher.user_id,
      section_id: course.section_id,
    });
  });

  it("takes the week number from the caller, duplicates and all", async () => {
    // Recorded rather than endorsed. Nothing derives or checks week_no, so two
    // week 1s are a state the API will happily produce.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    await createLessonPlan({ section_id: course.section_id, week_no: 1 });

    const response = await request(app)
      .post("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        week_no: 1,
        title: "สัปดาห์ที่ 1 อีกครั้ง",
        section_id: course.section_id,
      });

    expect(response.status).toBe(200);

    const stored = await prisma.course_syllabus.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored.map((week) => week.week_no)).toEqual([1, 1]);
  });

  it("answers 400 when week_no is missing", async () => {
    // course_syllabus.week_no is NOT NULL and has no default, so this used to
    // reach Postgres and come back a 500.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ title: "แนะนำรายวิชา", section_id: course.section_id });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: week_no ต้องระบุ",
      errors: [{ field: "week_no", location: "body", message: "ต้องระบุ" }],
    });

    const stored = await prisma.course_syllabus.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toEqual([]);
  });

  it("answers 400 for a week number that is not a positive number", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        week_no: "สัปดาห์แรก",
        title: "แนะนำรายวิชา",
        section_id: course.section_id,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "week_no", location: "body", message: "ต้องเป็นตัวเลข" },
    ]);

    const stored = await prisma.course_syllabus.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toEqual([]);
  });

  it("answers 400 when the week belongs to no section", async () => {
    // Every read filters by section, so a week written without one could
    // never be read back. See BEHAVIOR-CHANGES.md.
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ week_no: 1, title: "แนะนำรายวิชา" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "body", message: "ต้องระบุ" },
    ]);
  });
});

describe("PUT /lesson-plan", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).put("/lesson-plan").send({});

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const week = await createLessonPlan({
      section_id: course.section_id,
      title: "หัวข้อเดิม",
    });

    const response = await request(app)
      .put("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({ lesson_plan_id: week.id, title: "หัวข้อใหม่" });

    expect(response.status).toBe(403);

    const stored = await prisma.course_syllabus.findUnique({
      where: { id: week.id },
    });
    expect(stored?.title).toBe("หัวข้อเดิม");
  });

  it("changes the title, description and remark", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({
      section_id: course.section_id,
      week_no: 2,
      title: "หัวข้อเดิม",
    });

    const response = await request(app)
      .put("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        lesson_plan_id: week.id,
        title: "แบบจำลองข้อมูลเชิงสัมพันธ์",
        description: "ER diagram และการทำ normalisation",
        remark: "เตรียมโจทย์มาด้วย",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: week.id,
      title: "แบบจำลองข้อมูลเชิงสัมพันธ์",
    });

    const stored = await prisma.course_syllabus.findUnique({
      where: { id: week.id },
    });
    expect(stored).toMatchObject({
      title: "แบบจำลองข้อมูลเชิงสัมพันธ์",
      description: "ER diagram และการทำ normalisation",
      remark: "เตรียมโจทย์มาด้วย",
      // Not in UpdateLessonPlanBody, so an update cannot move a week.
      week_no: 2,
    });
  });

  it("fails for a week that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .put("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ lesson_plan_id: 999_999, title: "หัวข้อใหม่" });

    expect(response.status).toBe(500);
  });

  it("answers 400 when no week is named", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .put("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ title: "หัวข้อใหม่" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "lesson_plan_id", location: "body", message: "ต้องระบุ" },
    ]);
  });
});

describe("DELETE /lesson-plan", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).delete("/lesson-plan");

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .delete("/lesson-plan")
      .query({ lesson_plan_id: week.id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);

    const stored = await prisma.course_syllabus.findUnique({
      where: { id: week.id },
    });
    expect(stored).not.toBeNull();
  });

  it("removes the week and closes the gap in the numbering", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const first = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
      created_by: teacher.user_id,
    });
    const second = await createLessonPlan({
      section_id: course.section_id,
      week_no: 2,
      created_by: teacher.user_id,
    });
    const third = await createLessonPlan({
      section_id: course.section_id,
      week_no: 3,
      created_by: teacher.user_id,
    });

    const response = await request(app)
      .delete("/lesson-plan")
      .query({ lesson_plan_id: first.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ lesson_plan_id: first.id });

    const remaining = await prisma.course_syllabus.findMany({
      where: { section_id: course.section_id },
      orderBy: { id: "asc" },
    });
    expect(remaining.map((week) => [week.id, week.week_no])).toEqual([
      [second.id, 1],
      [third.id, 2],
    ]);
  });

  it("renumbers every remaining week, whoever wrote it", async () => {
    // Two teachers on one section is a real arrangement, and the renumbering
    // used to skip the weeks the other one wrote — leaving two weeks with the
    // same number. See BEHAVIOR-CHANGES.md.
    const teacher = await createTeacher();
    const colleague = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const mine = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
      created_by: teacher.user_id,
    });
    const theirs = await createLessonPlan({
      section_id: course.section_id,
      week_no: 2,
      created_by: colleague.user_id,
    });
    const alsoMine = await createLessonPlan({
      section_id: course.section_id,
      week_no: 3,
      created_by: teacher.user_id,
    });

    await request(app)
      .delete("/lesson-plan")
      .query({ lesson_plan_id: mine.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    const remaining = await prisma.course_syllabus.findMany({
      where: { section_id: course.section_id },
      orderBy: { id: "asc" },
    });
    expect(remaining.map((week) => [week.id, week.week_no])).toEqual([
      [theirs.id, 1],
      [alsoMine.id, 2],
    ]);
  });

  it("renumbers only the section the week belonged to", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const otherCourse = await createCourse({ teacher_id: teacher.user_id });
    const doomed = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
    });
    const untouched = await createLessonPlan({
      section_id: otherCourse.section_id,
      week_no: 9,
    });

    await request(app)
      .delete("/lesson-plan")
      .query({ lesson_plan_id: doomed.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    const stored = await prisma.course_syllabus.findUnique({
      where: { id: untouched.id },
    });
    expect(stored?.week_no).toBe(9);
  });

  it("keeps the work that was planned in it, now in no week", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });
    const activity = await createActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
    });
    const learningActivity = await createLearningActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
    });

    await request(app)
      .delete("/lesson-plan")
      .query({ lesson_plan_id: week.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    const storedActivity = await prisma.activities.findUnique({
      where: { id: activity.id },
    });
    const storedLearningActivity =
      await prisma.learning_activities.findUnique({
        where: { id: learningActivity.id },
      });

    expect(storedActivity?.course_syllabus_id).toBeNull();
    expect(storedLearningActivity?.course_syllabus_id).toBeNull();
  });

  it("takes the week's material with it", async () => {
    // course_material.course_syllabus_id is one of the few real foreign keys
    // in this area, and it cascades.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });
    const material = await createCourseMaterial({
      course_syllabus_id: week.id,
    });

    await request(app)
      .delete("/lesson-plan")
      .query({ lesson_plan_id: week.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    const stored = await prisma.course_material.findUnique({
      where: { id: material.id },
    });
    expect(stored).toBeNull();
  });

  it("fails for a week that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .delete("/lesson-plan")
      .query({ lesson_plan_id: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(500);
  });

  it("answers 400 when no week is named, and deletes nothing", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .delete("/lesson-plan")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "lesson_plan_id", location: "query", message: "ต้องระบุ" },
    ]);

    const stored = await prisma.course_syllabus.findUnique({
      where: { id: week.id },
    });
    expect(stored).not.toBeNull();
  });
});

describe("GET /lesson-plan/options", () => {
  it("returns each week as a dropdown option, in order", async () => {
    const course = await createCourse();
    const second = await createLessonPlan({
      section_id: course.section_id,
      week_no: 2,
      title: "แบบจำลองข้อมูล",
    });
    const first = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
      title: "แนะนำรายวิชา",
    });

    const response = await request(app)
      .get("/lesson-plan/options")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { value: first.id, label: "สัปดาห์ที่ 1: แนะนำรายวิชา" },
      { value: second.id, label: "สัปดาห์ที่ 2: แบบจำลองข้อมูล" },
    ]);
  });

  it("returns an empty list for a section with no plan", async () => {
    const course = await createCourse();

    const response = await request(app)
      .get("/lesson-plan/options")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("answers 400 for a section id that is not a positive number", async () => {
    const response = await request(app)
      .get("/lesson-plan/options")
      .query({ section_id: 0 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องมากกว่า 0" },
    ]);
  });
});

describe("GET /lesson-plan/student", () => {
  it("hides work whose announcement date has not arrived", async () => {
    const course = await createCourse();
    const week = await createLessonPlan({ section_id: course.section_id });
    await createActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
      activity_name: "การบ้านที่ประกาศแล้ว",
      announcement_date: YESTERDAY,
    });
    await createActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
      activity_name: "การบ้านที่ยังไม่ประกาศ",
      announcement_date: TOMORROW,
    });
    await createLearningActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
      learning_activity_name: "กิจกรรมที่ประกาศแล้ว",
      announcement_date: YESTERDAY,
    });

    const response = await request(app)
      .get("/lesson-plan/student")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data[0].allActivities).toEqual([
      "การบ้านที่ประกาศแล้ว",
      "กิจกรรมที่ประกาศแล้ว",
    ]);
  });

  it("hides work with no announcement date at all", async () => {
    // A null date counts as "not announced", not as "always announced".
    const course = await createCourse();
    const week = await createLessonPlan({ section_id: course.section_id });
    await createActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
      activity_name: "การบ้านที่ไม่ได้ตั้งวันประกาศ",
    });

    const response = await request(app)
      .get("/lesson-plan/student")
      .query({ section_id: course.section_id });

    expect(response.body.data[0].allActivities).toEqual([]);
  });

  it("includes the material attached to each week", async () => {
    const course = await createCourse();
    const week = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
      title: "แนะนำรายวิชา",
    });
    const slides = await createLinkAttachment({
      title: "สไลด์สัปดาห์ที่ 1",
      url: "https://example.test/week-1",
    });
    await createCourseMaterial({
      course_syllabus_id: week.id,
      attachment_id: slides.attachment_id,
      type: "LECTURE",
    });

    const response = await request(app)
      .get("/lesson-plan/student")
      .query({ section_id: course.section_id });

    expect(response.body.data[0].course_materials).toEqual({
      lecture: {
        file: [],
        url: [
          expect.objectContaining({
            attachment_id: slides.attachment_id,
            title: "สไลด์สัปดาห์ที่ 1",
            url: "https://example.test/week-1",
          }),
        ],
      },
      record: { file: [], url: [] },
    });
  });

  it("answers 400 when section_id is missing", async () => {
    await createLessonPlan({ section_id: (await createCourse()).section_id });

    const response = await request(app).get("/lesson-plan/student");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});
