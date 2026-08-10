import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createLinkAttachment,
  createPortfolioThesis,
  createStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * The final-year project — /portfolio-thesis.
 *
 * A student normally has one of these, but the table does not say so: it is a
 * plain list keyed by user like the rest of the group, and posting twice makes
 * two rows.
 *
 * It is the only section here with no date column at all, so its list is
 * ordered by id descending — "newest" means most recently written, not most
 * recently done. It carries four is_show_* flags, one per free-text field, all
 * of which the controller has to convert out of multipart's strings.
 *
 * Authorisation is the same everywhere in the group since #31 — a session, and
 * your own rows — and portfolio-education.test.ts carries those cases in full.
 */

const PDF = Buffer.from("%PDF-1.4 example");

describe("GET /portfolio-thesis", () => {
  it("returns the student's projects, most recently written first", async () => {
    const student = await createStudent();
    const first = await createPortfolioThesis({
      user_id: student.student_id,
      name: "ปริญญานิพนธ์แรก",
    });
    const second = await createPortfolioThesis({
      user_id: student.student_id,
      name: "ปริญญานิพนธ์ที่สอง",
    });

    const response = await request(app)
      .get("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((t: { id: number }) => t.id)).toEqual([
      second.id,
      first.id,
    ]);
    expect(response.body.data[1]).toEqual({
      id: first.id,
      user_id: student.student_id,
      name: "ปริญญานิพนธ์แรก",
      repository: null,
      role_and_resp: null,
      init_expect: null,
      reflection: null,
      is_show_repo: true,
      is_show_role: true,
      is_show_init: true,
      is_show_reflec: true,
      attachments: [],
    });
  });

  it("returns the attachments hanging off a project", async () => {
    const student = await createStudent();
    const file = await createFileAttachment({
      original_filename: "poster.pdf",
      file_path: "portfolio-thesis/1-2-poster.pdf",
      file_size: 8192,
    });
    const link = await createLinkAttachment({
      title: "วิดีโอนำเสนอ",
      url: "https://example.test/demo",
    });
    await createPortfolioThesis({
      user_id: student.student_id,
      attachment_ids: [file.attachment_id, link.attachment_id],
    });

    const response = await request(app)
      .get("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data[0].attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: "portfolio-thesis/1-2-poster.pdf",
        file_path: "portfolio-thesis/1-2-poster.pdf",
        original_filename: "poster.pdf",
        file_size: 8192,
      },
      {
        attachment_id: link.attachment_id,
        url: "https://example.test/demo",
        file_path: null,
        original_filename: "วิดีโอนำเสนอ",
        file_size: null,
      },
    ]);
  });

  it("leaves out another student's projects", async () => {
    const student = await createStudent();
    const mine = await createPortfolioThesis({ user_id: student.student_id });
    await createPortfolioThesis();

    const response = await request(app)
      .get("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data.map((t: { id: number }) => t.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /portfolio-thesis/:id", () => {
  it("returns the project the id names", async () => {
    const entry = await createPortfolioThesis({
      name: "ปริญญานิพนธ์ตัวอย่าง",
      repository: "https://example.test/repo",
    });

    const response = await request(app)
      .get(`/portfolio-thesis/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ปริญญานิพนธ์ตัวอย่าง",
      repository: "https://example.test/repo",
    });
  });

  it("refuses another student's project", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioThesis();

    const response = await request(app)
      .get(`/portfolio-thesis/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
    });
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-thesis/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no project", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-thesis/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบโครงงานที่ต้องการ",
    });
  });
});

describe("POST /portfolio-thesis", () => {
  it("creates a project and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ปริญญานิพนธ์ตัวอย่าง")
      .field("repository", "https://example.test/repo")
      .field("role_and_resp", "พัฒนาส่วนหลังบ้าน");

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      name: "ปริญญานิพนธ์ตัวอย่าง",
      repository: "https://example.test/repo",
      role_and_resp: "พัฒนาส่วนหลังบ้าน",
      attachments: [],
    });

    const stored = await prisma.portfolio_thesis.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].repository).toBe("https://example.test/repo");
  });

  it("reads the four is_show flags out of the strings multipart carries", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ปริญญานิพนธ์ตัวอย่าง")
      .field("is_show_repo", "false")
      .field("is_show_role", "true")
      .field("is_show_init", "false")
      .field("is_show_reflec", "true");

    expect(response.status).toBe(201);

    const stored = await prisma.portfolio_thesis.findFirstOrThrow({
      where: { user_id: student.student_id },
    });
    expect(stored).toMatchObject({
      is_show_repo: false,
      is_show_role: true,
      is_show_init: false,
      is_show_reflec: true,
    });
  });

  it("uploads the files and hangs them off the project", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ปริญญานิพนธ์ตัวอย่าง")
      .attach("files", PDF, "poster.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.attachments).toHaveLength(1);

    const objects = await listStoredObjects("portfolio-thesis/");
    expect(objects).toContain(response.body.data.attachments[0].file_path);
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-thesis")
      .field("name", "ปริญญานิพนธ์ไร้เจ้าของ");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.portfolio_thesis.count({
        where: { name: "ปริญญานิพนธ์ไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("refuses a session for a user who does not exist", async () => {
    const response = await request(app)
      .post("/portfolio-thesis")
      .set("Cookie", sessionCookie({ userId: "99999999" }))
      .field("name", "ปริญญานิพนธ์ไร้เจ้าของ");

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_thesis.count({ where: { user_id: "99999999" } }),
    ).toBe(0);
  });
});

describe("PUT /portfolio-thesis/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const entry = await createPortfolioThesis({
      name: "ปริญญานิพนธ์เดิม",
      repository: "https://example.test/old",
    });

    const response = await request(app)
      .put(`/portfolio-thesis/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .field("name", "ปริญญานิพนธ์ใหม่");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ปริญญานิพนธ์ใหม่",
      repository: "https://example.test/old",
    });
    expect(
      (
        await prisma.portfolio_thesis.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("ปริญญานิพนธ์ใหม่");
  });

  it("adds the uploaded files to the ones already there", async () => {
    const existing = await createFileAttachment();
    const entry = await createPortfolioThesis({
      attachment_ids: [existing.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-thesis/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .attach("files", PDF, "extra.pdf");

    expect(response.status).toBe(200);
    expect(response.body.data.attachments).toHaveLength(2);
  });

  it("drops the join row ids_to_delete names and leaves the attachment", async () => {
    const dropped = await createFileAttachment();
    const kept = await createFileAttachment();
    const entry = await createPortfolioThesis({
      attachment_ids: [dropped.attachment_id, kept.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-thesis/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ ids_to_delete: [dropped.attachment_id] });

    expect(response.status).toBe(200);
    expect(
      response.body.data.attachments.map(
        (a: { attachment_id: number }) => a.attachment_id,
      ),
    ).toEqual([kept.attachment_id]);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: dropped.attachment_id },
      }),
    ).not.toBeNull();
  });

  it("refuses another student's project, and changes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioThesis({ name: "ปริญญานิพนธ์เดิม" });

    const response = await request(app)
      .put(`/portfolio-thesis/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .field("name", "ปริญญานิพนธ์ใหม่");

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_thesis.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("ปริญญานิพนธ์เดิม");
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-thesis/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ปริญญานิพนธ์ใหม่");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a project that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-thesis/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ปริญญานิพนธ์ใหม่");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-thesis/:id", () => {
  it("removes the project and its join rows", async () => {
    const student = await createStudent();
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioThesis({
      user_id: student.student_id,
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioThesis({ user_id: student.student_id });

    const response = await request(app)
      .delete(`/portfolio-thesis/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_thesis.findMany({
        where: { user_id: student.student_id },
      }),
    ).toHaveLength(1);
    expect(
      await prisma.portfolio_thesis.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_thesis_attachments.findMany({
        where: { thesis_id: doomed.id },
      }),
    ).toHaveLength(0);
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-thesis/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a project that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-thesis/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
