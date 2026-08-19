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
 * Since #30 the poster has to teach the section, and the fan-out reaches only
 * the sections they teach — so every case that posts arranges the teacher onto
 * the course. The rule is in docs/adr/0002-section-access.md.
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
      response.body.data.map(
        (a: { announcement_id: number }) => a.announcement_id,
      ),
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

  it("answers with exactly the keys an announcement row has", async () => {
    // The row goes over whole — `findMany` with no `select`, spread into the
    // attachment list — so `section_id` rides along with the nine columns the
    // feed shows. `AnnouncementDetailResp` in @deep-portfolio/api-types is
    // written from this case (#68), which is why the three dates are asserted
    // as ISO strings and `status` as the null it always is: nothing writes that
    // column, on this route or any other.
    const course = await createCourse();
    const announcement = await createAnnouncement({
      section_id: course.section_id,
      title: "ประกาศใหม่",
      updated_at: new Date("2026-02-01T09:00:00Z"),
    });

    const response = await request(app)
      .get("/announcement")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        announcement_id: announcement.announcement_id,
        title: "ประกาศใหม่",
        content: { text: "เนื้อหาประกาศตัวอย่าง" },
        created_by: "70000000",
        created_at: announcement.created_at?.toISOString(),
        updated_at: "2026-02-01T09:00:00.000Z",
        published_at: announcement.published_at?.toISOString(),
        status: null,
        is_pinned: false,
        view_count: 0,
        section_id: course.section_id,
        attachments: { file: [], url: [] },
      },
    ]);
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
      response.body.data.map(
        (a: { announcement_id: number }) => a.announcement_id,
      ),
    ).toEqual([mine.announcement_id]);
  });

  it("answers 400 when section_id is missing", async () => {
    const response = await request(app).get("/announcement");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: section_id ต้องระบุ",
      errors: [{ field: "section_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("POST /announcement", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/announcement").send({});

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
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .field("title", "ประกาศจากผู้ที่ไม่ใช่อาจารย์")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("section_id", String(course.section_id))
      .field("all_section", "false");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
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

  it("records the session as the author, whoever the request names", async () => {
    // The author used to be a body field, so a teacher could post under a
    // colleague's name. The field is gone from the schema; a request that still
    // sends one has it dropped rather than refused. See BEHAVIOR-CHANGES.md.
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
    expect(posted.created_by).toBe(teacher.user_id);
  });

  it("refuses a teacher who does not teach the section, and stores nothing", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const colleague = await createTeacher();
    const storedBefore = await listStoredObjects(UPLOAD_FOLDER);

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: colleague.user_id }))
      .field("title", "ประกาศถึงกลุ่มของคนอื่น")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("section_id", String(course.section_id))
      .field("all_section", "false")
      .attach("files", PDF, "colleague.pdf");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของกลุ่มเรียนนี้",
    });
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
    // multer holds the upload in memory and the service is what puts it in the
    // bucket, so a refusal before the service leaves nothing behind.
    expect(await listStoredObjects(UPLOAD_FOLDER)).toEqual(storedBefore);
  });

  it("uploads the attached files and links them to the announcement", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ใบงานสัปดาห์นี้")
      .field("content", JSON.stringify({ text: "ส่งภายในวันศุกร์" }))
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

  it("keeps neither the attachment nor its file when the post fails", async () => {
    // The attachments are made before the announcement rows they hang on, so
    // a refusal on the row leaves them behind unless something takes them
    // back — which is what #50 added, here through the same
    // transactionWithUploads that POST /course-material goes through.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const storedBefore = await listStoredObjects(UPLOAD_FOLDER);

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      // Longer than the 255 characters announcements.title holds, and nothing
      // checks the length before Postgres does — so the row is refused only
      // after the attachment has been written and its file uploaded.
      .field("title", "ยาว".repeat(200))
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("section_id", String(course.section_id))
      .field("all_section", "false")
      .field(
        "urls",
        JSON.stringify([
          { title: "ลิงก์ค้างเติ่ง", url: "https://example.test/announce" },
        ]),
      )
      .attach("files", PDF, "rolled-back.pdf");

    expect(response.status).toBe(500);
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
    expect(
      await prisma.attachments.findFirst({
        where: { url: "https://example.test/announce" },
      }),
    ).toBeNull();
    expect(await listStoredObjects(UPLOAD_FOLDER)).toEqual(storedBefore);
  });

  it("posts to every section of the course the teacher teaches when all_section is set", async () => {
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
      teacher_id: teacher.user_id,
    });
    const elsewhere = await createCourse({ teacher_id: teacher.user_id });
    const attachment = "https://example.test/all-sections";

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศถึงทุกกลุ่ม")
      .field("content", JSON.stringify({ text: "งดการเรียนการสอน" }))
      .field("section_id", String(first.section_id))
      .field("all_section", "true")
      .field(
        "urls",
        JSON.stringify([{ title: "รายละเอียด", url: attachment }]),
      );

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

  it("leaves a colleague's section of the same course out of all_section", async () => {
    // See BEHAVIOR-CHANGES.md. The fan-out used to look up any teacher of the
    // named section and then post to every section of that course, so a teacher
    // of one section wrote to a colleague's noticeboard.
    const teacher = await createTeacher();
    const colleague = await createTeacher();
    const mine = await createCourse({
      section_number: "1",
      teacher_id: teacher.user_id,
    });
    const theirs = await createCourse({
      subject_id: mine.subject_id,
      section_number: "2",
      teacher_id: colleague.user_id,
    });

    await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศถึงกลุ่มของฉัน")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("section_id", String(mine.section_id))
      .field("all_section", "true");

    const posted = await prisma.announcements.findMany({
      where: { title: "ประกาศถึงกลุ่มของฉัน" },
    });
    expect(posted.map((a) => a.section_id)).toEqual([mine.section_id]);
    expect(
      await prisma.announcements.count({
        where: { section_id: theirs.section_id },
      }),
    ).toBe(0);
  });

  it("answers 400 when the request leaves out all_section", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศไม่ครบ")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("section_id", String(course.section_id));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "all_section", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
  });

  it("answers 400 when the post has no title and no content, and uploads nothing", async () => {
    // The two fields the post is actually made of, as opposed to all_section
    // above, which is a switch on how far it travels. A post carrying files and
    // nothing else has to be turned away before any of them reach the bucket —
    // multer has already read them by the time the body is looked at (TC-16).
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const storedBefore = await listStoredObjects(UPLOAD_FOLDER);

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("section_id", String(course.section_id))
      .field("all_section", "false")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "title", location: "body", message: "ต้องระบุ" },
      { field: "content", location: "body", message: "ต้องระบุ" },
    ]);
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
    expect(await listStoredObjects(UPLOAD_FOLDER)).toEqual(storedBefore);
  });

  it("answers 400 for content that is not JSON, and uploads nothing", async () => {
    // The field used to go to JSON.parse inside the controller's try block, so
    // a caller who sent plain text got a 500 quoting a position in a string
    // they had never seen. The files are the reason this matters: multer has
    // already read them by the time the body is looked at, and the request must
    // be turned away before any of them reach the bucket.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const storedBefore = await listStoredObjects(UPLOAD_FOLDER);

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศเนื้อหาไม่ใช่ JSON")
      .field("content", "ไม่ใช่ JSON")
      .field("section_id", String(course.section_id))
      .field("all_section", "false")
      .attach("files", PDF, "worksheet.pdf");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "content",
        location: "body",
        message: "รูปแบบไม่ถูกต้อง",
      },
    ]);
    expect(
      await prisma.announcements.count({
        where: { section_id: course.section_id },
      }),
    ).toBe(0);
    expect(await listStoredObjects(UPLOAD_FOLDER)).toEqual(storedBefore);
  });

  it("answers 400 when all_section is neither true nor false", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/announcement")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .field("title", "ประกาศ")
      .field("content", JSON.stringify({ text: "เนื้อหา" }))
      .field("section_id", String(course.section_id))
      .field("all_section", "yes");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "all_section",
        location: "body",
        message: "ต้องเป็นค่า true หรือ false",
      },
    ]);
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

  it("sends uploaded_at as an ISO string and file_size as a number", async () => {
    // The shape of an attachment is the same wherever one appears — six
    // features embed it — so this is the one place it is pinned to what JSON
    // actually carries (#68). `uploaded_at` is a Date in the column and a
    // string on the wire; `file_size` is a BigInt in the column, which
    // JSON.stringify refuses outright, and the service converts it.
    //
    // The expected string names UTC because the value written did: the column
    // is `timestamptz`, so Postgres holds the instant and hands the same one
    // back whatever zone the machine running this is in.
    const course = await createCourse();
    const file = await createFileAttachment({
      file_size: 2048,
      uploaded_at: new Date("2026-05-01T07:30:00.000Z"),
    });
    const link = await createLinkAttachment({
      uploaded_at: new Date("2026-05-02T07:30:00.000Z"),
    });
    const announcement = await createAnnouncement({
      section_id: course.section_id,
      attachment_ids: [file.attachment_id, link.attachment_id],
    });

    const response = await request(app).get(
      `/announcement/${announcement.announcement_id}/attachments`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.file[0]).toMatchObject({
      file_size: 2048,
      uploaded_at: "2026-05-01T07:30:00.000Z",
    });
    expect(response.body.data.url[0]).toMatchObject({
      uploaded_at: "2026-05-02T07:30:00.000Z",
    });
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
