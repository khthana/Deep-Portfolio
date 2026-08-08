import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createPortfolioCertificate,
  createStudent,
} from "./factories";
import { listStoredObjects } from "./helpers/storage";

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
 * Nothing on this route group is behind any middleware; the user being acted
 * for is whoever the query string or body says. That is #31.
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
      .query({ user_id: student.student_id });

    expect(response.body.data.map((c: { id: number }) => c.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    const response = await request(app).get("/portfolio-certificate");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "user_id is required",
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

    const response = await request(app).get(
      `/portfolio-certificate/${entry.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ประกาศนียบัตรภาษาอังกฤษ",
    });
    expect(response.body.data.attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: "portfolio-certificate/1-2-certificate.pdf",
        file_path: "portfolio-certificate/1-2-certificate.pdf",
        original_filename: "certificate.pdf",
        file_size: 1024,
      },
    ]);
  });

  it("answers 404 for an id that belongs to no certificate", async () => {
    const response = await request(app).get("/portfolio-certificate/999999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Portfolio certificate not found",
    });
  });
});

describe("POST /portfolio-certificate", () => {
  it("creates a certificate and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app).post("/portfolio-certificate").send({
      user_id: student.student_id,
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
      .field("user_id", student.student_id)
      .field("name", "ประกาศนียบัตรพร้อมไฟล์")
      .field("is_show", "false")
      .attach("files", PDF, "certificate.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.is_show).toBe(false);
    expect(response.body.data.attachments).toHaveLength(1);

    const objects = await listStoredObjects("portfolio-certificate/");
    expect(objects).toContain(response.body.data.attachments[0].file_path);
  });

  it("refuses a request that names no user", async () => {
    const response = await request(app)
      .post("/portfolio-certificate")
      .send({ name: "ประกาศนียบัตรไร้เจ้าของ" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "user_id is required",
    });
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
    // Recorded, not endorsed: an absent date leaves the column alone, and so
    // does an explicit null — the update passes `undefined` for anything
    // falsy, so a date cannot be cleared through this endpoint at all.
    const entry = await createPortfolioCertificate({
      date: new Date("2023-03-01"),
    });

    const response = await request(app)
      .put(`/portfolio-certificate/${entry.id}`)
      .send({ name: "ชื่อใหม่", date: null });

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBe("2023-03-01T00:00:00.000Z");
  });

  it("fails for a certificate that does not exist", async () => {
    const response = await request(app)
      .put("/portfolio-certificate/999999")
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-certificate/:id", () => {
  it("removes the certificate and the links to what was attached", async () => {
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioCertificate({
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioCertificate();

    const response = await request(app).delete(
      `/portfolio-certificate/${doomed.id}`,
    );

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
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: attachment.attachment_id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_certificate.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
  });

  it("answers 400 for an id that is not a number", async () => {
    const response = await request(app).delete("/portfolio-certificate/abc");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "Invalid ID" });
  });
});
