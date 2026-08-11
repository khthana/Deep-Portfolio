import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createAnnouncement,
  createCourse,
  createCourseMaterial,
  createFileAttachment,
  createLessonPlan,
  createLinkAttachment,
  createTeacher,
  createUser,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * Slides, recordings and links, hung off a week of the lesson plan —
 * /course-material.
 *
 * Two kinds of thing share one table. A "file" was uploaded and lives in the
 * bucket; a "link" is a URL somebody pasted and nothing was uploaded at all.
 * The read endpoint splits them back apart, per week and per kind, which is
 * why the shape it returns is four lists deep.
 *
 * Uploading is the only place in this API where a request has a side effect
 * outside Postgres, so the cases here look at the bucket as well as the
 * database.
 */

const PDF = Buffer.from("%PDF-1.4 example\n");

/**
 * Every case in a file shares one database and one bucket, so anything counted
 * has to be counted within the section the case created. Uploads are keyed by
 * section, which makes that easy on the storage side.
 */
function sectionPrefix(section_id: number): string {
  return `course-material/${section_id}/`;
}

describe("GET /course-material", () => {
  it("returns each week's material, split by kind", async () => {
    const course = await createCourse();
    const week = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
      title: "แนะนำรายวิชา",
    });
    const slides = await createFileAttachment({
      title: "สไลด์สัปดาห์ที่ 1",
      original_filename: "week-1.pdf",
      file_size: 2048,
      file_type: "PDF",
    });
    const recording = await createLinkAttachment({
      title: "วิดีโอย้อนหลัง",
      url: "https://example.test/recording/1",
    });
    await createCourseMaterial({
      course_syllabus_id: week.id,
      attachment_id: slides.attachment_id,
      type: "LECTURE",
    });
    await createCourseMaterial({
      course_syllabus_id: week.id,
      attachment_id: recording.attachment_id,
      type: "RECORD",
    });

    // No cookie: the student's material page reads this.
    const response = await request(app)
      .get("/course-material")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        course_syllabus_id: week.id,
        week_no: 1,
        title: "แนะนำรายวิชา",
        course_materials: {
          lecture: {
            file: [
              expect.objectContaining({
                attachment_id: slides.attachment_id,
                title: "สไลด์สัปดาห์ที่ 1",
                original_filename: "week-1.pdf",
                file_size: 2048,
                file_type: "PDF",
              }),
            ],
            url: [],
          },
          record: {
            file: [],
            url: [
              expect.objectContaining({
                attachment_id: recording.attachment_id,
                title: "วิดีโอย้อนหลัง",
                url: "https://example.test/recording/1",
              }),
            ],
          },
        },
      },
    ]);
  });

  it("lists a week that has no material at all", async () => {
    const course = await createCourse();
    const week = await createLessonPlan({
      section_id: course.section_id,
      week_no: 1,
      title: "แนะนำรายวิชา",
    });

    const response = await request(app)
      .get("/course-material")
      .query({ section_id: course.section_id });

    expect(response.body.data).toEqual([
      {
        course_syllabus_id: week.id,
        week_no: 1,
        title: "แนะนำรายวิชา",
        course_materials: {
          lecture: { file: [], url: [] },
          record: { file: [], url: [] },
        },
      },
    ]);
  });

  it("returns only this section's weeks", async () => {
    const course = await createCourse();
    const otherCourse = await createCourse();
    const mine = await createLessonPlan({ section_id: course.section_id });
    await createLessonPlan({ section_id: otherCourse.section_id });

    const response = await request(app)
      .get("/course-material")
      .query({ section_id: course.section_id });

    expect(
      response.body.data.map(
        (week: { course_syllabus_id: number }) => week.course_syllabus_id,
      ),
    ).toEqual([mine.id]);
  });

  it("answers 400 when section_id is missing", async () => {
    await createLessonPlan({ section_id: (await createCourse()).section_id });

    const response = await request(app).get("/course-material");

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

describe("POST /course-material", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/course-material").send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });

  it("stores nothing in the bucket when the caller is refused", async () => {
    // The upload middleware used to be registered ahead of the role check, so
    // a request that was about to be told 403 had already had its file read in
    // and was one step from the bucket. See BEHAVIOR-CHANGES.md.
    const user = await createUser();
    const course = await createCourse();
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .attach("lecture_files", PDF, "week-1.pdf");

    expect(response.status).toBe(403);
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
    expect(
      await prisma.course_material.count({
        where: { course_syllabus_id: week.id },
      }),
    ).toBe(0);
  });

  it("uploads a lecture file and attaches it to the week", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .attach("lecture_files", PDF, "week-1.pdf");

    expect(response.status).toBe(200);

    const material = await prisma.course_material.findMany({
      where: { course_syllabus_id: week.id },
      include: { attachments: true },
    });
    expect(material).toHaveLength(1);
    expect(material[0].type).toBe("LECTURE");
    expect(material[0].attachments).toMatchObject({
      title: "week-1.pdf",
      attachment_type: "file",
      original_filename: "week-1.pdf",
      file_size: BigInt(PDF.length),
      file_type: "PDF",
    });

    // The object itself, under a key that says which section and week it
    // belongs to.
    const stored = await listStoredObjects(sectionPrefix(course.section_id));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toContain(`${week.id}/lecture/`);
    expect(material[0].attachments.file_path).toBe(stored[0]);
  });

  it("attaches a recording link without uploading anything", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .field(
        "record_urls",
        JSON.stringify([
          { title: "วิดีโอย้อนหลัง", url: "https://example.test/recording/1" },
        ]),
      );

    expect(response.status).toBe(200);

    const material = await prisma.course_material.findMany({
      where: { course_syllabus_id: week.id },
      include: { attachments: true },
    });
    expect(material).toHaveLength(1);
    expect(material[0].type).toBe("RECORD");
    expect(material[0].attachments).toMatchObject({
      title: "วิดีโอย้อนหลัง",
      attachment_type: "link",
      url: "https://example.test/recording/1",
    });
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
  });

  it("adds to the week rather than replacing what is there", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });
    const existing = await createCourseMaterial({
      course_syllabus_id: week.id,
    });

    await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .attach("lecture_files", PDF, "week-1.pdf");

    const material = await prisma.course_material.findMany({
      where: { course_syllabus_id: week.id },
    });
    expect(material).toHaveLength(2);
    expect(material.map((row) => row.id)).toContain(existing.id);
  });

  it("does nothing when the request carries no material", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id));

    expect(response.status).toBe(200);
    expect(
      await prisma.course_material.count({
        where: { course_syllabus_id: week.id },
      }),
    ).toBe(0);
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
  });

  it("fails for a week that does not exist, leaving the attachment behind", async () => {
    // Recorded, not endorsed. The attachment row is written by a service that
    // was handed no transaction, so it is already committed by the time the
    // foreign key on course_material rejects the week — the failed request
    // leaves an attachment nothing points at.
    //
    // Still a 500 after #42: a foreign key is P2003, not the P2025 that became
    // a 404, and the two are different news — one says a value in the body
    // names nothing, the other that the row addressed is gone.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", "999999")
      .field("section_id", String(course.section_id))
      .field(
        "record_urls",
        JSON.stringify([
          { title: "วิดีโอค้างเติ่ง", url: "https://example.test/orphan" },
        ]),
      );

    expect(response.status).toBe(500);
    expect(
      await prisma.course_material.findMany({
        where: { course_syllabus_id: 999_999 },
      }),
    ).toEqual([]);
    expect(
      await prisma.attachments.findFirst({
        where: { url: "https://example.test/orphan" },
      }),
    ).not.toBeNull();
  });

  it("answers 400 when no week is named, and uploads nothing", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .attach("lecture_files", PDF, "week-1.pdf");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "course_syllabus_id",
        location: "body",
        message: "ต้องระบุ",
      },
    ]);
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
  });

  it("answers 400 for a list of links that is not JSON", async () => {
    // The controller handed this string to JSON.parse inside its try block, so
    // a mistyped list came back a 500 quoting a position in it.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .field("record_urls", "ไม่ใช่ JSON");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "record_urls", location: "body", message: "ต้องเป็นรายการ" },
    ]);
    expect(
      await prisma.course_material.count({
        where: { course_syllabus_id: week.id },
      }),
    ).toBe(0);
  });

  it("answers 400 for a link with no address", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    const response = await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .field("record_urls", JSON.stringify([{ title: "วิดีโอไร้ที่อยู่" }]));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "record_urls[0].url", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.attachments.count({
        where: { title: "วิดีโอไร้ที่อยู่" },
      }),
    ).toBe(0);
  });
});

describe("DELETE /course-material", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).delete("/course-material");

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const week = await createLessonPlan({ section_id: course.section_id });
    const attachment = await createFileAttachment();
    await createCourseMaterial({
      course_syllabus_id: week.id,
      attachment_id: attachment.attachment_id,
    });

    const response = await request(app)
      .delete("/course-material")
      .query({ attachment_id: attachment.attachment_id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);

    const stored = await prisma.attachments.findUnique({
      where: { attachment_id: attachment.attachment_id },
    });
    expect(stored).not.toBeNull();
  });

  it("removes the material and the attachment behind it", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });
    const doomed = await createFileAttachment();
    const kept = await createFileAttachment();
    const doomedMaterial = await createCourseMaterial({
      course_syllabus_id: week.id,
      attachment_id: doomed.attachment_id,
    });
    const keptMaterial = await createCourseMaterial({
      course_syllabus_id: week.id,
      attachment_id: kept.attachment_id,
    });

    const response = await request(app)
      .delete("/course-material")
      .query({ attachment_id: doomed.attachment_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);

    const material = await prisma.course_material.findMany({
      where: { course_syllabus_id: week.id },
    });
    expect(material.map((row) => row.id)).toEqual([keptMaterial.id]);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: doomed.attachment_id },
      }),
    ).toBeNull();
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: kept.attachment_id },
      }),
    ).not.toBeNull();
    expect(doomedMaterial.attachment_id).toBe(doomed.attachment_id);
  });

  it("removes the uploaded object from the bucket", async () => {
    // The row and the object go together (#34): nothing else references the
    // attachment once the material is gone, and an object nothing points at
    // can never be reached or removed through the screens again.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .attach("lecture_files", PDF, "week-1.pdf");

    const uploaded = await prisma.course_material.findFirstOrThrow({
      where: { course_syllabus_id: week.id },
    });
    const objectsBefore = await listStoredObjects(
      sectionPrefix(course.section_id),
    );
    expect(objectsBefore).toHaveLength(1);

    await request(app)
      .delete("/course-material")
      .query({ attachment_id: uploaded.attachment_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: uploaded.attachment_id },
      }),
    ).toBeNull();
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      [],
    );
  });

  it("keeps the object of an attachment another record still points at", async () => {
    // The sweep is by reference, not by owner: the material row goes, but the
    // announcement still names the same attachment, so neither the row nor the
    // object may be taken out from under it (#34).
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });

    await request(app)
      .post("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("course_syllabus_id", String(week.id))
      .field("section_id", String(course.section_id))
      .attach("lecture_files", PDF, "week-1.pdf");

    const uploaded = await prisma.course_material.findFirstOrThrow({
      where: { course_syllabus_id: week.id },
    });
    const objectsBefore = await listStoredObjects(
      sectionPrefix(course.section_id),
    );
    await createAnnouncement({
      section_id: course.section_id,
      attachment_ids: [uploaded.attachment_id],
    });

    const response = await request(app)
      .delete("/course-material")
      .query({ attachment_id: uploaded.attachment_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(
      await prisma.course_material.findMany({
        where: { course_syllabus_id: week.id },
      }),
    ).toEqual([]);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: uploaded.attachment_id },
      }),
    ).not.toBeNull();
    expect(await listStoredObjects(sectionPrefix(course.section_id))).toEqual(
      objectsBefore,
    );
  });

  it("answers 404 for an attachment that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .delete("/course-material")
      .query({ attachment_id: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    // P2025 used to leave here as a 500, telling the caller the server had
    // broken over a row that is merely absent (#42). These routes own no
    // sentence of their own, so the error handler's general one stands.
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลที่ต้องการ",
    });
  });

  it("answers 400 when no attachment is named, and deletes nothing", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const week = await createLessonPlan({ section_id: course.section_id });
    const attachment = await createFileAttachment();
    await createCourseMaterial({
      course_syllabus_id: week.id,
      attachment_id: attachment.attachment_id,
    });

    const response = await request(app)
      .delete("/course-material")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "attachment_id", location: "query", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: attachment.attachment_id },
      }),
    ).not.toBeNull();
  });
});
