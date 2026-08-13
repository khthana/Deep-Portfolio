import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createCourse,
  createLearningActivity,
  createLearningActivityGroup,
  createLearningSubmission,
  createLessonPlan,
  createLinkAttachment,
  createStudent,
  createTeacher,
  createUser,
  enrolStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * Classroom work — /learning-activity.
 *
 * The same shape as /activity and a separate table all the way down, because a
 * learning activity is not marked out of anything: there is no score column on
 * it, no rubric, and no score category. A teacher records that a student did it
 * and writes them a comment, and that is all.
 *
 * The two halves of a screen are not always guarded the same way, which is why
 * the roster endpoint below has cases of its own — see BEHAVIOR-CHANGES.md.
 */

const PDF = Buffer.from("%PDF-1.4 example\n");

/** Uploads from this route all land under one prefix, shared by every case in
 *  the file, so a case that cares takes the difference itself. */
const LEARNING_PREFIX = "learning-activity/";

describe("POST /learning-activity", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/learning-activity");

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
      .post("/learning-activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "อภิปรายกลุ่ม")
      .field("learning_activity_type", "INDIVIDUAL");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.learning_activities.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
  });

  it("stores nothing in the bucket when the caller is refused", async () => {
    // Same ordering fault as /activity, fixed the same way. See
    // BEHAVIOR-CHANGES.md.
    const user = await createUser();
    const course = await createCourse();
    const before = await listStoredObjects(LEARNING_PREFIX);

    const response = await request(app)
      .post("/learning-activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "อภิปรายกลุ่ม")
      .field("learning_activity_type", "INDIVIDUAL")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(403);
    expect(await listStoredObjects(LEARNING_PREFIX)).toEqual(before);
  });

  it("creates the activity and a row for every student enrolled", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });
    const enrolled = await createStudent();
    await enrolStudent(course.section_id, enrolled.student_id);

    const response = await request(app)
      .post("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("course_syllabus_id", String(week.id))
      .field("learning_activity_name", "อภิปรายกลุ่ม")
      // Sent upper case by the frontend, stored lower case.
      .field("learning_activity_type", "GROUP")
      .field("detail", JSON.stringify({ instruction: "กลุ่มละ 4 คน" }));

    expect(response.status).toBe(200);

    const activity = await prisma.learning_activities.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(activity).toMatchObject({
      section_id: course.section_id,
      course_syllabus_id: week.id,
      learning_activity_name: "อภิปรายกลุ่ม",
      learning_activity_type: "group",
      detail: { instruction: "กลุ่มละ 4 คน" },
    });

    const rows = await prisma.student_learning_activity.findMany({
      where: { learning_activity_id: activity.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      student_id: enrolled.student_id,
      status: "NOT_SUBMITTED",
    });
  });

  it("uploads an attached worksheet and hangs it off the activity", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "ใบงานที่ 1")
      .field("learning_activity_type", "INDIVIDUAL")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(200);

    const attached = await prisma.learning_activity_attachments.findMany({
      where: { learning_activity_id: response.body.data.id },
      include: { attachments: true },
    });
    expect(attached).toHaveLength(1);
    expect(attached[0].attachments).toMatchObject({
      title: "worksheet.pdf",
      attachment_type: "file",
      original_filename: "worksheet.pdf",
      file_size: BigInt(PDF.length),
      file_type: "PDF",
    });
    expect(await listStoredObjects(LEARNING_PREFIX)).toContain(
      attached[0].attachments.file_path,
    );
  });

  it("answers 400 when the section is missing", async () => {
    // section_id is NOT NULL here, unlike on activities, so the NaN a missing
    // field parsed to used to reach Postgres as a null it would not take.
    const teacher = await createTeacher();

    const response = await request(app)
      .post("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("learning_activity_name", "กิจกรรมไร้ห้องเรียน")
      .field("learning_activity_type", "INDIVIDUAL");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: section_id ต้องระบุ",
      errors: [{ field: "section_id", location: "body", message: "ต้องระบุ" }],
    });
    expect(
      await prisma.learning_activities.count({
        where: { learning_activity_name: "กิจกรรมไร้ห้องเรียน" },
      }),
    ).toBe(0);
  });

  it("answers 400 for a kind of work it does not have, and uploads nothing", async () => {
    // Same plain VarChar as /activity, read back the same way, so the same two
    // words are all it takes.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const before = await listStoredObjects(LEARNING_PREFIX);

    const response = await request(app)
      .post("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "กิจกรรมประเภทประหลาด")
      .field("learning_activity_type", "PAIR")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "learning_activity_type",
        location: "body",
        message: "ต้องเป็นค่าใดค่าหนึ่งใน: INDIVIDUAL, GROUP",
      },
    ]);
    expect(
      await prisma.learning_activities.count({
        where: { learning_activity_name: "กิจกรรมประเภทประหลาด" },
      }),
    ).toBe(0);
    expect(await listStoredObjects(LEARNING_PREFIX)).toEqual(before);
  });

  it("answers 400 for links that are not JSON", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "กิจกรรมลิงก์พัง")
      .field("learning_activity_type", "INDIVIDUAL")
      .field("urls", "ไม่ใช่ JSON");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "urls", location: "body", message: "ต้องเป็นรายการ" },
    ]);
    expect(
      await prisma.learning_activities.count({
        where: { learning_activity_name: "กิจกรรมลิงก์พัง" },
      }),
    ).toBe(0);
  });
});

describe("PUT /learning-activity", () => {
  it("rejects a request with no session", async () => {
    const activity = await createLearningActivity();

    const response = await request(app)
      .put("/learning-activity")
      .field("learning_activity_id", String(activity.id))
      .field("learning_activity_name", "ชื่อใหม่")
      .field("learning_activity_type", "INDIVIDUAL");

    expect(response.status).toBe(401);
    expect(
      (
        await prisma.learning_activities.findUniqueOrThrow({
          where: { id: activity.id },
        })
      ).learning_activity_name,
    ).toBe(activity.learning_activity_name);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await createLearningActivity();

    const response = await request(app)
      .put("/learning-activity")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("learning_activity_id", String(activity.id))
      .field("section_id", String(activity.section_id))
      .field("learning_activity_name", "ชื่อใหม่")
      .field("learning_activity_type", "INDIVIDUAL");

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.learning_activities.findUniqueOrThrow({
          where: { id: activity.id },
        })
      ).learning_activity_name,
    ).toBe(activity.learning_activity_name);
  });

  it("updates the activity, adding and removing attachments", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const activity = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_name: "ใบงานที่ 1",
    });
    const doomed = await createLinkAttachment();
    await prisma.learning_activity_attachments.create({
      data: {
        learning_activity_id: activity.id,
        attachment_id: doomed.attachment_id,
      },
    });

    const response = await request(app)
      .put("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("learning_activity_id", String(activity.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "ใบงานที่ 1 (แก้ไข)")
      .field("learning_activity_type", "GROUP")
      .field("remove_attachment_ids", JSON.stringify([doomed.attachment_id]))
      .field(
        "urls",
        JSON.stringify([
          { title: "ใบงานใหม่", url: "https://example.test/worksheet" },
        ]),
      );

    expect(response.status).toBe(200);

    const updated = await prisma.learning_activities.findUniqueOrThrow({
      where: { id: activity.id },
      include: {
        learning_activity_attachments: { include: { attachments: true } },
      },
    });
    expect(updated).toMatchObject({
      learning_activity_name: "ใบงานที่ 1 (แก้ไข)",
      learning_activity_type: "group",
    });
    expect(updated.learning_activity_attachments).toHaveLength(1);
    expect(updated.learning_activity_attachments[0].attachments).toMatchObject({
      title: "ใบงานใหม่",
      url: "https://example.test/worksheet",
    });

    // The activity was the only thing pointing at the removed attachment, so
    // it goes with the link rather than being left behind (#34).
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: doomed.attachment_id },
      }),
    ).toBeNull();
  });

  it("removes only its own attachment, whatever ids the request names", async () => {
    // See BEHAVIOR-CHANGES.md. The delete used to match on attachment id
    // alone, so naming another activity's attachment unlinked it there — and
    // once #34 put the sweep behind that delete, it would have destroyed the
    // file as well.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const stranger = await createLinkAttachment();
    const other = await createLearningActivity({
      section_id: course.section_id,
    });
    await prisma.learning_activity_attachments.create({
      data: {
        learning_activity_id: other.id,
        attachment_id: stranger.attachment_id,
      },
    });
    const activity = await createLearningActivity({
      section_id: course.section_id,
    });

    const response = await request(app)
      .put("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("learning_activity_id", String(activity.id))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "ชื่อใหม่")
      .field("learning_activity_type", "INDIVIDUAL")
      .field("remove_attachment_ids", JSON.stringify([stranger.attachment_id]));

    expect(response.status).toBe(200);
    expect(
      await prisma.learning_activity_attachments.findMany({
        where: { learning_activity_id: other.id },
        select: { attachment_id: true },
      }),
    ).toEqual([{ attachment_id: stranger.attachment_id }]);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: stranger.attachment_id },
      }),
    ).not.toBeNull();
  });

  it("answers 404 for an activity that does not exist", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .put("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("learning_activity_id", "999999")
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "ไม่มีอยู่จริง")
      .field("learning_activity_type", "INDIVIDUAL");

    // P2025 used to leave here as a 500, telling the caller the server had
    // broken over a row that is merely absent (#42). These routes own no
    // sentence of their own, so the error handler's general one stands.
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลที่ต้องการ",
    });
  });

  it("answers 400 when no activity is named", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const activity = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_name: "ชื่อเดิม",
    });

    const response = await request(app)
      .put("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("learning_activity_name", "ชื่อใหม่")
      .field("learning_activity_type", "INDIVIDUAL");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "learning_activity_id", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      (
        await prisma.learning_activities.findUniqueOrThrow({
          where: { id: activity.id },
        })
      ).learning_activity_name,
    ).toBe("ชื่อเดิม");
  });
});

describe("DELETE /learning-activity", () => {
  it("rejects a request with no session", async () => {
    const activity = await createLearningActivity();

    const response = await request(app)
      .delete("/learning-activity")
      .query({ learning_activity_id: activity.id });

    expect(response.status).toBe(401);
    expect(
      await prisma.learning_activities.findUnique({
        where: { id: activity.id },
      }),
    ).not.toBeNull();
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await createLearningActivity();

    const response = await request(app)
      .delete("/learning-activity")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.learning_activities.findUnique({
        where: { id: activity.id },
      }),
    ).not.toBeNull();
  });

  it("deletes the activity and the students' rows with it", async () => {
    const teacher = await createTeacher();
    const handedOut = await createLinkAttachment();
    const handedIn = await createLinkAttachment();
    const activity = await createLearningActivity({
      attachment_ids: [handedOut.attachment_id],
    });
    const submission = await createLearningSubmission({
      learning_activity_id: activity.id,
      attachment_ids: [handedIn.attachment_id],
    });
    const survivor = await createLearningActivity();

    const response = await request(app)
      .delete("/learning-activity")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(
      await prisma.learning_activities.findUnique({
        where: { id: activity.id },
      }),
    ).toBeNull();
    expect(
      await prisma.student_learning_activity.findUnique({
        where: { id: submission.id },
      }),
    ).toBeNull();

    // The cascade takes the join rows on both sides, and nothing else points
    // at either attachment — so what the teacher handed out and what the
    // student handed in go too (#34).
    expect(
      await prisma.attachments.findMany({
        where: {
          attachment_id: {
            in: [handedOut.attachment_id, handedIn.attachment_id],
          },
        },
      }),
    ).toEqual([]);
    expect(
      await prisma.learning_activities.findUnique({
        where: { id: survivor.id },
      }),
    ).not.toBeNull();
  });

  it("answers 404 for an activity that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .delete("/learning-activity")
      .query({ learning_activity_id: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลที่ต้องการ",
    });
  });

  it("answers 400 when no activity is named, and deletes nothing", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity();

    const response = await request(app)
      .delete("/learning-activity")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "learning_activity_id", location: "query", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.learning_activities.findUnique({
        where: { id: activity.id },
      }),
    ).not.toBeNull();
  });
});

describe("GET /learning-activity", () => {
  it("returns the activity with its attachments", async () => {
    const activity = await createLearningActivity({
      learning_activity_name: "ใบงานที่ 1",
    });
    const attachment = await createLinkAttachment({
      title: "ใบงาน",
      url: "https://example.test/worksheet",
    });
    await prisma.learning_activity_attachments.create({
      data: {
        learning_activity_id: activity.id,
        attachment_id: attachment.attachment_id,
      },
    });

    // No cookie: the student's classroom page reads this.
    const response = await request(app)
      .get("/learning-activity")
      .query({ learning_activity_id: activity.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: activity.id,
      learning_activity_id: activity.id,
      learning_activity_name: "ใบงานที่ 1",
      // Stored lower case, handed back upper case.
      learning_activity_type: "INDIVIDUAL",
    });
    expect(response.body.data.attachments.url).toEqual([
      expect.objectContaining({
        attachment_id: attachment.attachment_id,
        url: "https://example.test/worksheet",
      }),
    ]);
  });

  it("answers with no data for an activity that does not exist", async () => {
    const response = await request(app)
      .get("/learning-activity")
      .query({ learning_activity_id: 999_999 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "get learning activity successfully",
    });
  });

  it("answers 400 when learning_activity_id is missing", async () => {
    const response = await request(app).get("/learning-activity");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: learning_activity_id ต้องระบุ",
      errors: [
        {
          field: "learning_activity_id",
          location: "query",
          message: "ต้องระบุ",
        },
      ],
    });
  });
});

describe("GET /learning-activity/list", () => {
  it("lists the section's activities with the week and how many handed in", async () => {
    const course = await createCourse();
    const week = await createLessonPlan({
      section_id: course.section_id,
      week_no: 3,
    });
    const activity = await createLearningActivity({
      section_id: course.section_id,
      course_syllabus_id: week.id,
      learning_activity_name: "ใบงานที่ 1",
    });
    await createLearningSubmission({
      learning_activity_id: activity.id,
      status: "SUBMITTED",
    });
    await createLearningSubmission({
      learning_activity_id: activity.id,
      status: "GRADED",
    });
    await createLearningSubmission({
      learning_activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .get("/learning-activity/list")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: activity.id,
      learning_activity_name: "ใบงานที่ 1",
      learning_activity_type: "INDIVIDUAL",
      week_no: 3,
      student_count: 3,
      submitted_count: 2,
      pending_grading_count: 1,
    });
  });

  it("answers 400 when section_id is missing", async () => {
    // section_id is NOT NULL on this table, so the null a missing parameter
    // used to turn into was not a value the column could be compared against
    // at all.
    await createLearningActivity();

    const response = await request(app).get("/learning-activity/list");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});

describe("GET /learning-activity/options", () => {
  it("returns the section's activities as value and label", async () => {
    const course = await createCourse();
    const first = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_name: "ใบงานที่ 1",
    });
    const second = await createLearningActivity({
      section_id: course.section_id,
      learning_activity_name: "ใบงานที่ 2",
    });
    await createLearningActivity();

    const response = await request(app)
      .get("/learning-activity/options")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { value: first.id, label: "ใบงานที่ 1" },
      { value: second.id, label: "ใบงานที่ 2" },
    ]);
  });

  it("answers 400 when section_id is missing", async () => {
    await createLearningActivity();

    const response = await request(app).get("/learning-activity/options");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "section_id", location: "query", message: "ต้องระบุ" },
    ]);
  });
});

describe("GET /learning-activity/student/detail", () => {
  it("returns one student's row alongside the activity itself", async () => {
    const student = await createStudent({ first_name_th: "สมชาย" });
    const activity = await createLearningActivity({
      learning_activity_name: "ใบงานที่ 1",
    });
    const submission = await createLearningSubmission({
      student_id: student.student_id,
      learning_activity_id: activity.id,
      status: "GRADED",
      feedback: "ร่วมอภิปรายดี",
    });

    const response = await request(app)
      .get("/learning-activity/student/detail")
      .query({ student_learning_activity_id: submission.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: submission.id,
      learning_activity_id: activity.id,
      learning_activity_name: "ใบงานที่ 1",
      student_id: student.student_id,
      status: "GRADED",
      feedback: "ร่วมอภิปรายดี",
      student: { first_name_th: "สมชาย" },
      submitted_files: { file: [], url: [] },
    });
  });

  it("answers an empty envelope for a row that does not exist", async () => {
    const response = await request(app)
      .get("/learning-activity/student/detail")
      .query({ student_learning_activity_id: 999_999 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      submitted_files: { file: [], url: [] },
    });
  });

  it("answers 400 for a row id that is not a number", async () => {
    const response = await request(app)
      .get("/learning-activity/student/detail")
      .query({ student_learning_activity_id: "abc" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "student_learning_activity_id",
        location: "query",
        message: "ต้องเป็นตัวเลข",
      },
    ]);
  });
});

describe("GET /learning-activity/submitted/list", () => {
  it("rejects a request with no session", async () => {
    // This roster used to be open to anyone with the URL, while the /activity
    // half of the same screen was a teacher's. See BEHAVIOR-CHANGES.md.
    const activity = await createLearningActivity();

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id });

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const activity = await createLearningActivity();

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);
  });

  it("returns everyone the activity was set for, those who handed something in first", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity({
      learning_activity_name: "ใบงานที่ 1",
    });
    const submitted = await createStudent({ first_name_th: "สมชาย" });
    const silent = await createStudent({ first_name_th: "สมหญิง" });
    const submission = await createLearningSubmission({
      student_id: submitted.student_id,
      learning_activity_id: activity.id,
      status: "SUBMITTED",
    });
    const placeholder = await createLearningSubmission({
      student_id: silent.student_id,
      learning_activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      learning_activity_id: activity.id,
      learning_activity_name: "ใบงานที่ 1",
    });
    // Same order as the graded half, for the same reason (#56).
    expect(response.body.data.submissions).toEqual([
      expect.objectContaining({
        id: submission.id,
        submission_type: "INDIVIDUAL",
        status: "SUBMITTED",
        student: expect.objectContaining({
          student_id: submitted.student_id,
          first_name_th: "สมชาย",
        }),
      }),
      expect.objectContaining({
        id: placeholder.id,
        submission_type: "INDIVIDUAL",
        status: "NOT_SUBMITTED",
        student: expect.objectContaining({
          student_id: silent.student_id,
          first_name_th: "สมหญิง",
        }),
      }),
    ]);
    // No score anywhere in the payload: this work is done or not done.
    expect(response.body.data.submissions[0]).not.toHaveProperty("score");
  });

  it("lists a group that has handed nothing in, and who it is waiting on", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity({
      learning_activity_type: "group",
    });
    const leader = await createStudent({ first_name_th: "สมชาย" });
    const pending = await createStudent({ first_name_th: "สมหญิง" });
    const group = await createLearningActivityGroup({
      learning_activity_id: activity.id,
      status: "NOT_SUBMITTED",
      members: [
        { student_id: leader.student_id },
        { student_id: pending.student_id, status: "PENDING" },
      ],
    });

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data.submissions).toHaveLength(1);
    const [submission] = response.body.data.submissions;
    expect(submission).toMatchObject({
      submission_type: "GROUP",
      status: "NOT_SUBMITTED",
      submitted_at: null,
    });
    expect(submission.group.group_id).toBe(group.id);
    expect(submission.group.unaccepted_members).toEqual([
      expect.objectContaining({
        student_id: pending.student_id,
        status: "PENDING",
      }),
    ]);
  });

  it("lists a student who is in no group at all as a row of their own", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity({
      learning_activity_type: "group",
    });
    const grouped = await createStudent();
    await createLearningActivityGroup({
      learning_activity_id: activity.id,
      members: [{ student_id: grouped.student_id }],
    });
    const alone = await createStudent({ first_name_th: "สมศรี" });
    const placeholder = await createLearningSubmission({
      student_id: alone.student_id,
      learning_activity_id: activity.id,
      status: "NOT_SUBMITTED",
    });

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    const alones = response.body.data.submissions.filter(
      (submission: { id: number }) => submission.id === placeholder.id,
    );
    expect(alones).toEqual([
      expect.objectContaining({
        submission_type: "INDIVIDUAL",
        status: "NOT_SUBMITTED",
        submitted_at: null,
        student: expect.objectContaining({
          student_id: alone.student_id,
          first_name_th: "สมศรี",
        }),
      }),
    ]);
    expect(alones[0]).not.toHaveProperty("group");
  });

  it("puts a group that handed something in ahead of one that did not", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity({
      learning_activity_type: "group",
    });
    const idle = await createLearningActivityGroup({
      learning_activity_id: activity.id,
      members: [{}],
    });
    const busy = await createLearningActivityGroup({
      learning_activity_id: activity.id,
      status: "SUBMITTED",
      members: [{}],
    });

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    // Created idle-first, so this is the sort talking and not the insertion
    // order coming back unchanged.
    expect(
      response.body.data.submissions.map(
        (submission: { group: { group_id: number } }) =>
          submission.group.group_id,
      ),
    ).toEqual([busy.id, idle.id]);
  });

  it("names the group members who never answered the invitation", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity({
      learning_activity_type: "group",
    });
    const leader = await createStudent({ first_name_th: "สมชาย" });
    const pending = await createStudent({ first_name_th: "สมหญิง" });
    const declined = await createStudent({ first_name_th: "สมศรี" });
    const group = await createLearningActivityGroup({
      learning_activity_id: activity.id,
      status: "SUBMITTED",
      members: [
        { student_id: leader.student_id },
        { student_id: pending.student_id, status: "PENDING" },
        { student_id: declined.student_id, status: "REJECTED" },
      ],
    });

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    const [submission] = response.body.data.submissions;
    expect(submission.submission_type).toBe("GROUP");
    expect(submission.group.group_id).toBe(group.id);
    expect(submission.group.members).toEqual([
      expect.objectContaining({
        student_id: leader.student_id,
        first_name_th: "สมชาย",
      }),
    ]);
    expect(submission.group.unaccepted_members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          student_id: pending.student_id,
          first_name_th: "สมหญิง",
          status: "PENDING",
        }),
        expect.objectContaining({
          student_id: declined.student_id,
          first_name_th: "สมศรี",
          status: "REJECTED",
        }),
      ]),
    );
    expect(submission.group.unaccepted_members).toHaveLength(2);
  });

  it("leaves the unanswered list empty when the whole group accepted", async () => {
    const teacher = await createTeacher();
    const activity = await createLearningActivity({
      learning_activity_type: "group",
    });
    const leader = await createStudent();
    const member = await createStudent();
    await createLearningActivityGroup({
      learning_activity_id: activity.id,
      status: "SUBMITTED",
      members: [
        { student_id: leader.student_id },
        { student_id: member.student_id, status: "ACCEPT" },
      ],
    });

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: activity.id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    const [submission] = response.body.data.submissions;
    expect(submission.group.members).toHaveLength(2);
    expect(submission.group.unaccepted_members).toEqual([]);
  });

  it("answers null for an activity that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/learning-activity/submitted/list")
      .query({ learning_activity_id: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });
});
