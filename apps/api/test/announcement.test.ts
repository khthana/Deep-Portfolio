import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createAnnouncement,
  createCourse,
  createFileAttachment,
  createLinkAttachment,
  createTeacher,
  createUser,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * The section's feed — /announcement.
 *
 * Posting one is the only write here; there is no edit and no delete. It takes
 * files and pasted links the same way course material does, and it can fan a
 * single post out to every section of the course at once, which is the part
 * worth watching: one request, several rows, all sharing the attachments.
 *
 * Uploads go to a folder that is not keyed by section, so the cases that look
 * at the bucket compare it against what was there before the request rather
 * than expecting it to be empty.
 */

const PDF = Buffer.from("%PDF-1.4 example\n");
const UPLOAD_FOLDER = "announcements/";

describe("GET /announcement", () => {
  it("returns the section's announcements, newest first", async () => {
    const course = await createCourse();
    const older = await createAnnouncement({
      section_id: course.section_id,
      title: "ประกาศเก่า",
      updated_at: new Date("2026-01-01T09:00:00Z"),
    });
    const newer = await createAnnouncement({
      section_id: course.section_id,
      title: "ประกาศใหม่",
      updated_at: new Date("2026-02-01T09:00:00Z"),
    });

    // No cookie: students read the feed too.
    const response = await request(app)
      .get("/announcement")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(
      response.body.data.map((a: { announcement_id: number }) => a.announcement_id),
    ).toEqual([newer.announcement_id, older.announcement_id]);
    expect(response.body.data[0]).toMatchObject({
      title: "ประกาศใหม่",
      content: { text: "เนื้อหาประกาศตัวอย่าง" },
      created_by: "70000000",
      section_id: course.section_id,
      is_pinned: false,
      view_count: 0,
      attachments: { file: [], url: [] },
    });
  });

  it("splits each announcement's attachments into files and links", async () => {
    const course = await createCourse();
    const slides = await createFileAttachment({
      title: "ใบงานสัปดาห์ที่ 1",
      original_filename: "worksheet.pdf",
    });
    const link = await createLinkAttachment({
      title: "แบบฟอร์มลงชื่อ",
      url: "https://example.test/form",
    });
    await createAnnouncement({
      section_id: course.section_id,
      attachment_ids: [slides.attachment_id, link.attachment_id],
    });

    const response = await request(app)
      .get("/announcement")
      .query({ section_id: course.section_id });

    expect(response.body.data[0].attachments.file).toEqual([
      expect.objectContaining({
        attachment_id: slides.attachment_id,
        title: "ใบงานสัปดาห์ที่ 1",
        original_filename: "worksheet.pdf",
      }),
    ]);
    expect(response.body.data[0].attachments.url).toEqual([
      expect.objectContaining({
        attachment_id: link.attachment_id,
        url: "https://example.test/form",
      }),
    ]);
  });

  it("returns only this section's announcements", async () => {
    const course = await createCourse();
    const otherCourse = await createCourse();
    const mine = await createAnnouncement({ section_id: course.section_id });
    await createAnnouncement({ section_id: otherCourse.section_id });

    const response = await request(app)
      .get("/announcement")
      .query({ section_id: course.section_id });

    expect(
      response.body.data.map((a: { announcement_id: number }) => a.announcement_id),
    ).toEqual([mine.announcement_id]);
  });

  it("fails when section_id is missing", async () => {
    // section_id is a required column here, so the NaN parseInt produces is a
    // Prisma validation error rather than the empty list the nullable columns
    // elsewhere give back. Recorded, not endorsed: request validation is issue
    // #20.
    const response = await request(app).get("/announcement");

    expect(response.status).toBe(500);
  });
});

describe("POST /announcement", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/announcement").send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("title", "ประกาศจากผู้ที่ไม่ใช่อาจารย์")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("created_by", user.user_id)
      .field("section_id", String(course.section_id))
      .field("all_section", "false");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
  });

  it("stores nothing and posts nothing when there is no session", async () => {
    // This endpoint had no authentication at all: anyone who could reach the
    // API could post to any section's feed and put files in the bucket. See
    // BEHAVIOR-CHANGES.md.
    const course = await createCourse();
    const storedBefore = await listStoredObjects(UPLOAD_FOLDER);

    const response = await request(app)
      .post("/announcement")
      .field("title", "ประกาศจากคนแปลกหน้า")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("created_by", "70000000")
      .field("section_id", String(course.section_id))
      .field("all_section", "false")
      .attach("files", PDF, "stranger.pdf");

    expect(response.status).toBe(401);
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
    expect(await listStoredObjects(UPLOAD_FOLDER)).toEqual(storedBefore);
  });

  it("posts to the section and answers with the new id", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "สอบกลางภาคสัปดาห์หน้า")
      .field("content", JSON.stringify({ text: "อ่านบทที่ 1-4" }))
      .field("created_by", teacher.user_id)
      .field("section_id", String(course.section_id))
      .field("all_section", "false");

    expect(response.status).toBe(200);

    const posted = await prisma.announcements.findMany({
      where: { section_id: course.section_id },
    });
    expect(posted).toHaveLength(1);
    expect(response.body.data).toEqual({
      announcement_id: posted[0].announcement_id,
    });
    expect(posted[0]).toMatchObject({
      title: "สอบกลางภาคสัปดาห์หน้า",
      content: { text: "อ่านบทที่ 1-4" },
      created_by: teacher.user_id,
    });
  });

  it("records the created_by the request asked for, not the session", async () => {
    // Recorded, not endorsed. The author is taken from the body, so a teacher
    // can post under a colleague's name. Ownership checks are absent across
    // this API — see the spec — and fixing them here alone would not help.
    const teacher = await createTeacher();
    const colleague = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศ")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("created_by", colleague.user_id)
      .field("section_id", String(course.section_id))
      .field("all_section", "false");

    const posted = await prisma.announcements.findFirstOrThrow({
      where: { section_id: course.section_id },
    });
    expect(posted.created_by).toBe(colleague.user_id);
  });

  it("uploads the attached files and links them to the announcement", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ใบงานสัปดาห์นี้")
      .field("content", JSON.stringify({ text: "ส่งภายในวันศุกร์" }))
      .field("created_by", teacher.user_id)
      .field("section_id", String(course.section_id))
      .field("all_section", "false")
      .field(
        "urls",
        JSON.stringify([
          { title: "แบบฟอร์มส่งงาน", url: "https://example.test/form" },
        ]),
      )
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(200);

    const links = await prisma.announcement_attachments.findMany({
      where: { announcement_id: response.body.data.announcement_id },
      include: { attachments: true },
    });
    expect(links).toHaveLength(2);

    const file = links
      .map((link) => link.attachments)
      .find((attachment) => attachment.attachment_type === "file");
    const url = links
      .map((link) => link.attachments)
      .find((attachment) => attachment.attachment_type === "link");

    expect(file).toMatchObject({
      title: "worksheet.pdf",
      original_filename: "worksheet.pdf",
      file_size: BigInt(PDF.length),
      file_type: "PDF",
    });
    expect(url).toMatchObject({
      title: "แบบฟอร์มส่งงาน",
      url: "https://example.test/form",
    });
    expect(await listStoredObjects(UPLOAD_FOLDER)).toContain(file!.file_path);
  });

  it("posts to every section of the course when all_section is set", async () => {
    const teacher = await createTeacher();
    // Same subject, same term: createCourse upserts the semester_course, so
    // these two sections are two sections of one course.
    const first = await createCourse({
      section_number: "1",
      teacher_id: teacher.user_id,
    });
    const second = await createCourse({
      subject_id: first.subject_id,
      section_number: "2",
    });
    const elsewhere = await createCourse();
    const attachment = "https://example.test/all-sections";

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศถึงทุกกลุ่ม")
      .field("content", JSON.stringify({ text: "งดการเรียนการสอน" }))
      .field("created_by", teacher.user_id)
      .field("section_id", String(first.section_id))
      .field("all_section", "true")
      .field("urls", JSON.stringify([{ title: "รายละเอียด", url: attachment }]));

    expect(response.status).toBe(200);

    const posted = await prisma.announcements.findMany({
      where: { title: "ประกาศถึงทุกกลุ่ม" },
      orderBy: { section_id: "asc" },
    });
    expect(posted.map((a) => a.section_id)).toEqual([
      first.section_id,
      second.section_id,
    ]);
    expect(posted.map((a) => a.section_id)).not.toContain(elsewhere.section_id);

    // The id in the response is the first one, and the attachment is uploaded
    // once and shared by both rows.
    expect(response.body.data.announcement_id).toBe(posted[0].announcement_id);
    const links = await prisma.announcement_attachments.findMany({
      where: {
        announcement_id: { in: posted.map((a) => a.announcement_id) },
      },
    });
    expect(links).toHaveLength(2);
    expect(new Set(links.map((link) => link.attachment_id)).size).toBe(1);
  });

  it("posts to the one section when all_section is set but nobody teaches it", async () => {
    // all_section reaches the other sections through course_sections_teacher.
    // With no row there the fan-out finds nothing and the post stays put.
    const teacher = await createTeacher();
    const first = await createCourse({ section_number: "1" });
    const second = await createCourse({
      subject_id: first.subject_id,
      section_number: "2",
    });

    await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศไร้ผู้สอน")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("created_by", teacher.user_id)
      .field("section_id", String(first.section_id))
      .field("all_section", "true");

    const posted = await prisma.announcements.findMany({
      where: { title: "ประกาศไร้ผู้สอน" },
    });
    expect(posted.map((a) => a.section_id)).toEqual([first.section_id]);
    expect(
      await prisma.announcements.count({
        where: { section_id: second.section_id },
      }),
    ).toBe(0);
  });

  it("fails when the request leaves out all_section", async () => {
    // Recorded, not endorsed: the controller parses the field as JSON without
    // checking it is there, so a missing one throws before anything is
    // written. Request validation is issue #20.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศไม่ครบ")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("created_by", teacher.user_id)
      .field("section_id", String(course.section_id));

    expect(response.status).toBe(500);
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
  });
});

describe("GET /announcement/:id/attachments", () => {
  it("returns the announcement's files and links", async () => {
    const course = await createCourse();
    const file = await createFileAttachment({ title: "สไลด์" });
    const link = await createLinkAttachment({ title: "วิดีโอ" });
    const announcement = await createAnnouncement({
      section_id: course.section_id,
      attachment_ids: [file.attachment_id, link.attachment_id],
    });

    const response = await request(app).get(
      `/announcement/${announcement.announcement_id}/attachments`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.file).toEqual([
      expect.objectContaining({ attachment_id: file.attachment_id }),
    ]);
    expect(response.body.data.url).toEqual([
      expect.objectContaining({ attachment_id: link.attachment_id }),
    ]);
  });

  it("returns empty lists for an announcement with no attachments", async () => {
    const course = await createCourse();
    const announcement = await createAnnouncement({
      section_id: course.section_id,
    });

    const response = await request(app).get(
      `/announcement/${announcement.announcement_id}/attachments`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ file: [], url: [] });
  });

  it("returns empty lists for an announcement that does not exist", async () => {
    // Recorded, not endorsed: the endpoint reads the join table and never
    // looks the announcement up, so a wrong id is indistinguishable from an
    // announcement with nothing attached.
    const response = await request(app).get("/announcement/999999/attachments");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ file: [], url: [] });
  });
});
