import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createLinkAttachment,
  createPortfolioAward,
  createStudent,
} from "./factories";
import { listStoredObjects } from "./helpers/storage";

/**
 * Prizes the student has won — /portfolio-award.
 *
 * The list, attachment and upload machinery is the group's usual, so what this
 * file is really about is the two places where award parts company with it,
 * both in how the service writes a row:
 *
 * - `is_show` is forced through a boolean on create, so a request that says
 *   nothing about it stores false — where every other section in the group
 *   leaves the column alone and takes the schema's default of true.
 * - `date` on update is `date ? new Date(date) : undefined`, so an empty date
 *   is not a clearing instruction, it is no instruction at all. Certificate has
 *   the same quirk; see the closing notes in BEHAVIOR-CHANGES.md.
 *
 * Nothing on this route group is behind any middleware; the user being acted
 * for is whoever the query or the body says. That is #31.
 */

const PDF = Buffer.from("%PDF-1.4 example");

describe("GET /portfolio-award", () => {
  it("returns the student's prizes, most recent first", async () => {
    const student = await createStudent();
    const earlier = await createPortfolioAward({
      user_id: student.student_id,
      name: "การแข่งขันแรก",
      date: new Date("2023-03-01"),
    });
    const later = await createPortfolioAward({
      user_id: student.student_id,
      name: "การแข่งขันที่สอง",
      date: new Date("2024-03-01"),
    });

    const response = await request(app)
      .get("/portfolio-award")
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((a: { id: number }) => a.id)).toEqual([
      later.id,
      earlier.id,
    ]);
    expect(response.body.data[1]).toEqual({
      id: earlier.id,
      user_id: student.student_id,
      organize: "หน่วยงานตัวอย่าง",
      name: "การแข่งขันแรก",
      award: "รางวัลชนะเลิศ",
      date: "2023-03-01T00:00:00.000Z",
      description: null,
      is_show: true,
      attachments: [],
    });
  });

  it("returns the attachments hanging off a prize", async () => {
    const student = await createStudent();
    const file = await createFileAttachment({
      original_filename: "certificate.pdf",
      file_path: "portfolio-award/1-2-certificate.pdf",
      file_size: 1024,
    });
    const link = await createLinkAttachment({
      title: "ประกาศผล",
      url: "https://example.test/results",
    });
    await createPortfolioAward({
      user_id: student.student_id,
      attachment_ids: [file.attachment_id, link.attachment_id],
    });

    const response = await request(app)
      .get("/portfolio-award")
      .query({ user_id: student.student_id });

    expect(response.body.data[0].attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: "portfolio-award/1-2-certificate.pdf",
        file_path: "portfolio-award/1-2-certificate.pdf",
        original_filename: "certificate.pdf",
        file_size: 1024,
      },
      {
        attachment_id: link.attachment_id,
        url: "https://example.test/results",
        file_path: null,
        original_filename: "ประกาศผล",
        file_size: null,
      },
    ]);
  });

  it("leaves out another student's prizes", async () => {
    const student = await createStudent();
    const mine = await createPortfolioAward({ user_id: student.student_id });
    await createPortfolioAward();

    const response = await request(app)
      .get("/portfolio-award")
      .query({ user_id: student.student_id });

    expect(response.body.data.map((a: { id: number }) => a.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    const response = await request(app).get("/portfolio-award");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "user_id is required",
    });
  });
});

describe("GET /portfolio-award/:id", () => {
  it("returns the prize the id names", async () => {
    const entry = await createPortfolioAward({
      name: "การแข่งขันตัวอย่าง",
      award: "รางวัลรองชนะเลิศ",
    });

    const response = await request(app).get(`/portfolio-award/${entry.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "การแข่งขันตัวอย่าง",
      award: "รางวัลรองชนะเลิศ",
    });
  });

  it("answers 400 for an id that is not a number", async () => {
    const response = await request(app).get("/portfolio-award/abc");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "Invalid ID" });
  });

  it("answers 404 for an id that belongs to no prize", async () => {
    const response = await request(app).get("/portfolio-award/999999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Portfolio award not found",
    });
  });
});

describe("POST /portfolio-award", () => {
  it("creates a prize and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-award")
      .field("user_id", student.student_id)
      .field("organize", "หน่วยงานตัวอย่าง")
      .field("name", "การแข่งขันตัวอย่าง")
      .field("award", "รางวัลชนะเลิศ")
      .field("date", "2024-03-01")
      .field("is_show", "true");

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      organize: "หน่วยงานตัวอย่าง",
      name: "การแข่งขันตัวอย่าง",
      award: "รางวัลชนะเลิศ",
      date: "2024-03-01T00:00:00.000Z",
      is_show: true,
      attachments: [],
    });

    const stored = await prisma.portfolio_award.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].award).toBe("รางวัลชนะเลิศ");
  });

  it("hides a prize the request says nothing about", async () => {
    // Recorded, not endorsed. is_show is forced through a boolean here, so an
    // absent field reads as false — the column's default of true never gets a
    // chance to apply, and the prize is created hidden. The frontend always
    // sends the field, which is why nobody has noticed.
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-award")
      .field("user_id", student.student_id)
      .field("name", "การแข่งขันตัวอย่าง");

    expect(response.status).toBe(201);
    expect(response.body.data.is_show).toBe(false);
    expect(
      (
        await prisma.portfolio_award.findFirstOrThrow({
          where: { user_id: student.student_id },
        })
      ).is_show,
    ).toBe(false);
  });

  it("stores no date when the request carries none", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-award")
      .field("user_id", student.student_id)
      .field("name", "การแข่งขันไร้วันที่");

    expect(response.status).toBe(201);
    expect(response.body.data.date).toBeNull();
  });

  it("uploads the files and hangs them off the prize", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-award")
      .field("user_id", student.student_id)
      .field("name", "การแข่งขันตัวอย่าง")
      .attach("files", PDF, "certificate.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.attachments).toHaveLength(1);

    const objects = await listStoredObjects("portfolio-award/");
    expect(objects).toContain(response.body.data.attachments[0].file_path);
  });

  it("refuses a request that names no user", async () => {
    const response = await request(app)
      .post("/portfolio-award")
      .field("name", "การแข่งขันไร้เจ้าของ");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "user_id is required",
    });
    expect(
      await prisma.portfolio_award.count({
        where: { name: "การแข่งขันไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("fails for a user who does not exist", async () => {
    const response = await request(app)
      .post("/portfolio-award")
      .field("user_id", "99999999")
      .field("name", "การแข่งขันไร้เจ้าของ");

    expect(response.status).toBe(500);
    expect(
      await prisma.portfolio_award.count({ where: { user_id: "99999999" } }),
    ).toBe(0);
  });
});

describe("PUT /portfolio-award/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const entry = await createPortfolioAward({
      name: "การแข่งขันเดิม",
      organize: "หน่วยงานเดิม",
    });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "การแข่งขันใหม่",
      organize: "หน่วยงานเดิม",
    });
  });

  it("leaves is_show alone when the request says nothing about it", async () => {
    // Unlike create, where an absent is_show means false. Update asks whether
    // the field was sent at all before it converts.
    const entry = await createPortfolioAward({ is_show: true });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .send({ name: "การแข่งขันใหม่" });

    expect(response.body.data.is_show).toBe(true);
  });

  it("keeps the date when the request sends an empty one", async () => {
    // Recorded, not endorsed: an empty date is read as "no instruction", so a
    // student cannot clear a date they entered by mistake. Certificate behaves
    // the same way; see the closing notes in BEHAVIOR-CHANGES.md.
    const entry = await createPortfolioAward({ date: new Date("2024-03-01") });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .send({ date: "" });

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBe("2024-03-01T00:00:00.000Z");
  });

  it("drops the join row ids_to_delete names and leaves the attachment", async () => {
    const dropped = await createFileAttachment();
    const kept = await createFileAttachment();
    const entry = await createPortfolioAward({
      attachment_ids: [dropped.attachment_id, kept.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
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

  it("answers 400 for an id that is not a number", async () => {
    const response = await request(app)
      .put("/portfolio-award/abc")
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "Invalid ID" });
  });

  it("fails for a prize that does not exist", async () => {
    const response = await request(app)
      .put("/portfolio-award/999999")
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-award/:id", () => {
  it("removes the prize and its join rows", async () => {
    const student = await createStudent();
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioAward({
      user_id: student.student_id,
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioAward({ user_id: student.student_id });

    const response = await request(app).delete(`/portfolio-award/${doomed.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_award.findMany({
        where: { user_id: student.student_id },
      }),
    ).toHaveLength(1);
    expect(
      await prisma.portfolio_award.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_award_attachments.findMany({
        where: { award_id: doomed.id },
      }),
    ).toHaveLength(0);
  });

  it("answers 400 for an id that is not a number", async () => {
    const response = await request(app).delete("/portfolio-award/abc");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: "Invalid ID" });
  });

  it("fails for a prize that does not exist", async () => {
    const response = await request(app).delete("/portfolio-award/999999");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
