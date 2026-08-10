import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createPortfolioCertificate,
  createStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";
import { signedFileKey, signedFileUrl } from "./helpers/file-url";

/**
 * Certificates the student holds — /portfolio-certificate.
 *
 * The training section with one column changed: a date where training has a
 * year, which is the only reason the two are separate tables and the only
 * place their endpoints differ. Everything else — the join table for
 * attachments, `ids_to_delete`, the multipart write path, the shared error
 * paths — behaves as it does there, and is covered in full in
 * portfolio-training.test.ts and portfolio-education.test.ts (T5). What is
 * here is one success and one failure for each endpoint, plus the date.
 *
 * Authorisation is the same everywhere in the group since #31 — a session, and
 * your own rows. T5 wants a refusal on every endpoint behind the middleware, so
 * each one here carries a 401, and every one that can name a row or a user
 * other than the caller's carries a 403 as well; the rule is in
 * docs/adr/0001-portfolio-access.md and the shapes are spelled out in
 * portfolio-education.test.ts.
 */

const PDF = Buffer.from("%PDF-1.4 example\n");

describe("GET /portfolio-certificate", () => {
  it("returns the student's certificates, most recent first", async () => {
    const student = await createStudent();
    const older = await createPortfolioCertificate({
      user_id: student.student_id,
      date: new Date("2023-03-01"),
      name: "ประกาศนียบัตรเก่า",
    });
    const newer = await createPortfolioCertificate({
      user_id: student.student_id,
      date: new Date("2025-11-20"),
      name: "ประกาศนียบัตรใหม่",
      organize: "หน่วยงานตัวอย่าง",
      description: "รายละเอียดตัวอย่าง",
    });

    const response = await request(app)
      .get("/portfolio-certificate")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((c: { id: number }) => c.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(response.body.data[0]).toEqual({
      id: newer.id,
      user_id: student.student_id,
      // A date column, so midnight UTC and no time of day to lose.
      date: "2025-11-20T00:00:00.000Z",
      organize: "หน่วยงานตัวอย่าง",
      name: "ประกาศนียบัตรใหม่",
      description: "รายละเอียดตัวอย่าง",
      is_show: true,
      attachments: [],
    });
  });

  it("leaves out another student's certificates", async () => {
    const student = await createStudent();
    const mine = await createPortfolioCertificate({
      user_id: student.student_id,
    });
    await createPortfolioCertificate();

    const response = await request(app)
      .get("/portfolio-certificate")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data.map((c: { id: number }) => c.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request with no session", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-certificate")
      .query({ user_id: student.student_id });

    expect(response.status).toBe(401);
  });

  it("refuses a student asking for somebody else's certificates", async () => {
    const owner = await createStudent();
    const stranger = await createStudent();
    await createPortfolioCertificate({ user_id: owner.student_id });

    const response = await request(app)
      .get("/portfolio-certificate")
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .query({ user_id: owner.student_id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
    });
  });

  it("refuses a request that names no user", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-certificate")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /portfolio-certificate/:id", () => {
  it("returns the certificate the id names, with what is attached to it", async () => {
    const file = await createFileAttachment({
      original_filename: "certificate.pdf",
      file_path: "portfolio-certificate/1-2-certificate.pdf",
      file_size: 1024,
    });
    const entry = await createPortfolioCertificate({
      name: "ประกาศนียบัตรภาษาอังกฤษ",
      attachment_ids: [file.attachment_id],
    });

    const response = await request(app)
      .get(`/portfolio-certificate/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ประกาศนียบัตรภาษาอังกฤษ",
    });
    expect(response.body.data.attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: signedFileUrl("portfolio-certificate/1-2-certificate.pdf"),
        file_path: signedFileUrl("portfolio-certificate/1-2-certificate.pdf"),
        original_filename: "certificate.pdf",
        file_size: 1024,
      },
    ]);
  });

  it("refuses a request with no session", async () => {
    const entry = await createPortfolioCertificate();

    const response = await request(app).get(
      `/portfolio-certificate/${entry.id}`,
    );

    expect(response.status).toBe(401);
  });

  it("refuses another student's certificate", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioCertificate();

    const response = await request(app)
      .get(`/portfolio-certificate/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
  });

  it("answers 404 for an id that belongs to no certificate", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-certificate/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบเกียรติบัตรที่ต้องการ",
    });
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-certificate/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });
});

describe("POST /portfolio-certificate", () => {
  it("creates a certificate and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-certificate")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        date: "2025-11-20",
        organize: "หน่วยงานตัวอย่าง",
        name: "ประกาศนียบัตรตัวอย่าง",
        description: "รายละเอียดตัวอย่าง",
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      date: "2025-11-20T00:00:00.000Z",
      name: "ประกาศนียบัตรตัวอย่าง",
      attachments: [],
    });

    const stored = await prisma.portfolio_certificate.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].date).toEqual(new Date("2025-11-20T00:00:00.000Z"));
  });

  it("uploads the certificates and attaches them to the entry", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-certificate")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ประกาศนียบัตรพร้อมไฟล์")
      .field("is_show", "false")
      .attach("files", PDF, "certificate.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.is_show).toBe(false);
    expect(response.body.data.attachments).toHaveLength(1);

    const objects = await listStoredObjects("portfolio-certificate/");
    expect(objects).toContain(
      signedFileKey(response.body.data.attachments[0].file_path),
    );
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-certificate")
      .send({ name: "ประกาศนียบัตรไร้เจ้าของ" });

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_certificate.count({
        where: { name: "ประกาศนียบัตรไร้เจ้าของ" },
      }),
    ).toBe(0);
  });
});

describe("PUT /portfolio-certificate/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const entry = await createPortfolioCertificate({
      name: "ชื่อเดิม",
      organize: "หน่วยงานเดิม",
      date: new Date("2023-03-01"),
    });

    const response = await request(app)
      .put(`/portfolio-certificate/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ name: "ชื่อใหม่", date: "2025-11-20" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ชื่อใหม่",
      organize: "หน่วยงานเดิม",
      date: "2025-11-20T00:00:00.000Z",
    });
  });

  it("keeps the date a request says nothing about", async () => {
    const entry = await createPortfolioCertificate({
      date: new Date("2023-03-01"),
    });

    const response = await request(app)
      .put(`/portfolio-certificate/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBe("2023-03-01T00:00:00.000Z");
  });

  it("clears the date when the request sends an explicit null", async () => {
    const entry = await createPortfolioCertificate({
      date: new Date("2023-03-01"),
    });

    const response = await request(app)
      .put(`/portfolio-certificate/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ name: "ชื่อใหม่", date: null });

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBeNull();
  });

  it("refuses a request with no session, and changes nothing", async () => {
    const entry = await createPortfolioCertificate({ name: "ชื่อเดิม" });

    const response = await request(app)
      .put(`/portfolio-certificate/${entry.id}`)
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(401);
    expect(
      (
        await prisma.portfolio_certificate.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("ชื่อเดิม");
  });

  it("refuses another student's certificate, and changes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioCertificate({ name: "ชื่อเดิม" });

    const response = await request(app)
      .put(`/portfolio-certificate/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_certificate.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("ชื่อเดิม");
  });

  it("fails for a certificate that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-certificate/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-certificate/:id", () => {
  it("removes the certificate and what was attached to it", async () => {
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioCertificate({
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioCertificate();

    const response = await request(app)
      .delete(`/portfolio-certificate/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: doomed.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_certificate.findUnique({
        where: { id: doomed.id },
      }),
    ).toBeNull();
    expect(
      await prisma.portfolio_certificate_attachments.count({
        where: { certificate_id: doomed.id },
      }),
    ).toBe(0);

    // Nothing else pointed at the file, so it goes with the certificate (#34).
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: attachment.attachment_id },
      }),
    ).toBeNull();
    expect(
      await prisma.portfolio_certificate.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
  });

  it("refuses a request with no session, and deletes nothing", async () => {
    const entry = await createPortfolioCertificate();

    const response = await request(app).delete(
      `/portfolio-certificate/${entry.id}`,
    );

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_certificate.findUnique({
        where: { id: entry.id },
      }),
    ).not.toBeNull();
  });

  it("refuses another student's certificate, and deletes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioCertificate();

    const response = await request(app)
      .delete(`/portfolio-certificate/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_certificate.findUnique({
        where: { id: entry.id },
      }),
    ).not.toBeNull();
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-certificate/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });
});
