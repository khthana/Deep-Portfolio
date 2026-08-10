import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createLinkAttachment,
  createPortfolioTraining,
  createStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * Courses and workshops the student attended — /portfolio-training.
 *
 * Same list-and-detail shape as the education section, with two things it does
 * not have: certificates of attendance are uploaded alongside the entry, and
 * the write endpoints accept multipart, so every field arrives as a string and
 * the controller converts `year` and `is_show` back by hand.
 *
 * Attachments hang off a join table rather than a column, so an entry can
 * carry several and losing one is a matter of deleting the join row — which is
 * what `ids_to_delete` does, and why the attachment itself survives it.
 *
 * The plain error paths this shares with the rest of the group — a
 * non-numeric id, an id that belongs to nobody — are covered in full in
 * portfolio-education.test.ts, which is the group's representative (T5). What
 * is here is one of each, plus everything that is particular to this endpoint.
 *
 * Authorisation is the same everywhere in the group since #31 — a session, and
 * your own rows — so portfolio-education.test.ts carries those cases in full
 * too. What is here is the pair this endpoint can get wrong on its own: a
 * refused upload must leave the bucket alone, and a refused write must leave
 * the entry alone.
 */

const PDF = Buffer.from("%PDF-1.4 example\n");

describe("GET /portfolio-training", () => {
  it("returns the student's training, most recent first", async () => {
    const student = await createStudent();
    const older = await createPortfolioTraining({
      user_id: student.student_id,
      year: 2564,
      name: "อบรมเก่า",
    });
    const newer = await createPortfolioTraining({
      user_id: student.student_id,
      year: 2567,
      name: "อบรมใหม่",
      country: "ไทย",
      organize: "หน่วยงานตัวอย่าง",
      description: "รายละเอียดตัวอย่าง",
    });

    const response = await request(app)
      .get("/portfolio-training")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((t: { id: number }) => t.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(response.body.data[0]).toEqual({
      id: newer.id,
      user_id: student.student_id,
      year: 2567,
      country: "ไทย",
      organize: "หน่วยงานตัวอย่าง",
      name: "อบรมใหม่",
      description: "รายละเอียดตัวอย่าง",
      is_show: true,
      attachments: [],
    });
  });

  it("returns the files and links attached to an entry", async () => {
    const student = await createStudent();
    const file = await createFileAttachment({
      original_filename: "certificate.pdf",
      file_path: "portfolio-training/1-2-certificate.pdf",
      file_size: 2048,
    });
    const link = await createLinkAttachment({
      title: "หน้าหลักสูตร",
      url: "https://example.test/course",
    });
    await createPortfolioTraining({
      user_id: student.student_id,
      attachment_ids: [file.attachment_id, link.attachment_id],
    });

    const response = await request(app)
      .get("/portfolio-training")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    // Files first, then links — the endpoint concatenates the two lists the
    // attachments service splits the rows into.
    expect(response.body.data[0].attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: "portfolio-training/1-2-certificate.pdf",
        file_path: "portfolio-training/1-2-certificate.pdf",
        original_filename: "certificate.pdf",
        file_size: 2048,
      },
      {
        attachment_id: link.attachment_id,
        url: "https://example.test/course",
        file_path: null,
        original_filename: "หน้าหลักสูตร",
        file_size: null,
      },
    ]);
  });

  it("leaves out another student's training", async () => {
    const student = await createStudent();
    const mine = await createPortfolioTraining({
      user_id: student.student_id,
    });
    await createPortfolioTraining();

    const response = await request(app)
      .get("/portfolio-training")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data.map((t: { id: number }) => t.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-training")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [
        { field: "user_id", location: "query", message: "ต้องระบุ" },
      ],
    });
  });
});

describe("GET /portfolio-training/:id", () => {
  it("returns the entry the id names, with what is attached to it", async () => {
    const file = await createFileAttachment({
      original_filename: "certificate.pdf",
      file_path: "portfolio-training/3-4-certificate.pdf",
      file_size: 512,
    });
    const entry = await createPortfolioTraining({
      name: "อบรมความปลอดภัย",
      year: 2566,
      attachment_ids: [file.attachment_id],
    });

    const response = await request(app)
      .get(`/portfolio-training/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "อบรมความปลอดภัย",
      year: 2566,
    });
    expect(response.body.data.attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: "portfolio-training/3-4-certificate.pdf",
        file_path: "portfolio-training/3-4-certificate.pdf",
        original_filename: "certificate.pdf",
        file_size: 512,
      },
    ]);
  });

  it("answers 404 for an id that belongs to no entry", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-training/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบการอบรมที่ต้องการ",
    });
  });
});

describe("POST /portfolio-training", () => {
  it("creates an entry and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-training")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        year: 2567,
        country: "ไทย",
        organize: "หน่วยงานตัวอย่าง",
        name: "อบรมตัวอย่าง",
        description: "รายละเอียดตัวอย่าง",
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      year: 2567,
      name: "อบรมตัวอย่าง",
      attachments: [],
    });

    const stored = await prisma.portfolio_training.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].organize).toBe("หน่วยงานตัวอย่าง");
  });

  it("reads the year and the visibility flag back out of multipart strings", async () => {
    // Multipart carries strings, so "2567" and "false" arrive where an Int and
    // a Boolean column are waiting. The controller converts both by hand.
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-training")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "อบรมซ่อนไว้")
      .field("year", "2567")
      .field("is_show", "false");

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ year: 2567, is_show: false });

    const stored = await prisma.portfolio_training.findFirstOrThrow({
      where: { user_id: student.student_id },
    });
    expect(stored.year).toBe(2567);
    expect(stored.is_show).toBe(false);
  });

  it("uploads the certificates and attaches them to the entry", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-training")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "อบรมพร้อมไฟล์")
      .attach("files", PDF, "certificate.pdf")
      .attach("files", PDF, "attendance.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.attachments).toHaveLength(2);
    expect(
      response.body.data.attachments
        .map((a: { original_filename: string }) => a.original_filename)
        .sort(),
    ).toEqual(["attendance.pdf", "certificate.pdf"]);

    const stored = await prisma.portfolio_training.findFirstOrThrow({
      where: { user_id: student.student_id },
      include: { portfolio_training_attachments: true },
    });
    expect(stored.portfolio_training_attachments).toHaveLength(2);

    const objects = await listStoredObjects("portfolio-training/");
    for (const attachment of response.body.data.attachments) {
      expect(objects).toContain(attachment.file_path);
    }
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-training")
      .send({ name: "อบรมไร้เจ้าของ" });

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_training.count({
        where: { name: "อบรมไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("stores nothing in the bucket when there is no session", async () => {
    // See BEHAVIOR-CHANGES.md. `requireUser` is registered ahead of the upload
    // middleware, so a request that is about to be refused never has its file
    // read off the stream, let alone written to MinIO.
    const before = await listStoredObjects("portfolio-training/");

    const response = await request(app)
      .post("/portfolio-training")
      .field("name", "อบรมไร้เจ้าของ")
      .attach("files", PDF, "orphan.pdf");

    expect(response.status).toBe(401);
    expect(await listStoredObjects("portfolio-training/")).toEqual(before);
  });
});

describe("PUT /portfolio-training/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const entry = await createPortfolioTraining({
      name: "ชื่อเดิม",
      organize: "หน่วยงานเดิม",
      year: 2565,
    });

    const response = await request(app)
      .put(`/portfolio-training/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ชื่อใหม่",
      organize: "หน่วยงานเดิม",
      year: 2565,
    });
  });

  it("adds the uploaded files to what is already attached", async () => {
    const existing = await createFileAttachment({
      original_filename: "old.pdf",
      file_path: "portfolio-training/5-6-old.pdf",
    });
    const entry = await createPortfolioTraining({
      attachment_ids: [existing.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-training/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .field("name", "ชื่อใหม่")
      .attach("files", PDF, "new.pdf");

    expect(response.status).toBe(200);
    expect(
      response.body.data.attachments
        .map((a: { original_filename: string }) => a.original_filename)
        .sort(),
    ).toEqual(["new.pdf", "old.pdf"]);
  });

  it("detaches what the request asks to be rid of, without deleting it", async () => {
    // Recorded, not endorsed: only the join row goes. The attachment stays in
    // the table and its object stays in the bucket, so both accumulate — the
    // same orphaning /course-material has, and it belongs with the wider
    // storage clean-up rather than with this ticket.
    const dropped = await createFileAttachment({
      original_filename: "dropped.pdf",
    });
    const kept = await createFileAttachment({ original_filename: "kept.pdf" });
    const entry = await createPortfolioTraining({
      attachment_ids: [dropped.attachment_id, kept.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-training/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ ids_to_delete: [dropped.attachment_id] });

    expect(response.status).toBe(200);
    expect(
      response.body.data.attachments.map(
        (a: { attachment_id: number }) => a.attachment_id,
      ),
    ).toEqual([kept.attachment_id]);
    expect(
      await prisma.portfolio_training_attachments.findMany({
        where: { training_id: entry.id },
      }),
    ).toEqual([
      { training_id: entry.id, attachment_id: kept.attachment_id },
    ]);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: dropped.attachment_id },
      }),
    ).not.toBeNull();
  });

  it("refuses another student's entry, and changes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioTraining({ name: "ชื่อเดิม" });

    const response = await request(app)
      .put(`/portfolio-training/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_training.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("ชื่อเดิม");
  });

  it("keeps a refused upload out of the bucket", async () => {
    // The ownership check is registered ahead of the upload middleware for the
    // same reason `requireUser` is: a request nobody is going to act on should
    // not leave a file behind in MinIO.
    const stranger = await createStudent();
    const entry = await createPortfolioTraining();
    const before = await listStoredObjects("portfolio-training/");

    const response = await request(app)
      .put(`/portfolio-training/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .field("name", "ชื่อใหม่")
      .attach("files", PDF, "orphan.pdf");

    expect(response.status).toBe(403);
    expect(await listStoredObjects("portfolio-training/")).toEqual(before);
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-training/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for an entry that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-training/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-training/:id", () => {
  it("removes the entry and the links to what was attached", async () => {
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioTraining({
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioTraining();

    const response = await request(app)
      .delete(`/portfolio-training/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: doomed.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_training.findUnique({ where: { id: doomed.id } }),
    ).toBeNull();
    expect(
      await prisma.portfolio_training_attachments.count({
        where: { training_id: doomed.id },
      }),
    ).toBe(0);

    // The attachment itself outlives the entry, same as on the detach path.
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: attachment.attachment_id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_training.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
  });

  it("refuses another student's entry, and deletes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioTraining();

    const response = await request(app)
      .delete(`/portfolio-training/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_training.findUnique({ where: { id: entry.id } }),
    ).not.toBeNull();
  });

  it("fails for an entry that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-training/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
