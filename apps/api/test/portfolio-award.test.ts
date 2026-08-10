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
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";
import { signedFileKey, signedFileUrl } from "./helpers/file-url";

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
 * Authorisation is the same everywhere in the group since #31 — a session, and
 * your own rows. T5 asks every endpoint behind the middleware for its own
 * refusal, so each one here carries a 401, and every one that can name a row
 * or a user other than the caller's carries a 403 as well. The rule and the
 * reasoning are in docs/adr/0001-portfolio-access.md, and the shared shapes are
 * spelled out in portfolio-education.test.ts. The case peculiar to this file is
 * the session for an account that is gone, which used to reach Postgres and
 * come back as a 500.
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
      .set("Cookie", sessionCookie({ userId: student.student_id }))
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
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data[0].attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: signedFileUrl("portfolio-award/1-2-certificate.pdf"),
        file_path: signedFileUrl("portfolio-award/1-2-certificate.pdf"),
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
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data.map((a: { id: number }) => a.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request with no session", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-award")
      .query({ user_id: student.student_id });

    expect(response.status).toBe(401);
  });

  it("refuses a student asking for somebody else's prizes", async () => {
    const owner = await createStudent();
    const stranger = await createStudent();
    await createPortfolioAward({ user_id: owner.student_id });

    const response = await request(app)
      .get("/portfolio-award")
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
      .get("/portfolio-award")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /portfolio-award/:id", () => {
  it("returns the prize the id names", async () => {
    const entry = await createPortfolioAward({
      name: "การแข่งขันตัวอย่าง",
      award: "รางวัลรองชนะเลิศ",
    });

    const response = await request(app)
      .get(`/portfolio-award/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "การแข่งขันตัวอย่าง",
      award: "รางวัลรองชนะเลิศ",
    });
  });

  it("refuses a request with no session", async () => {
    const entry = await createPortfolioAward();

    const response = await request(app).get(`/portfolio-award/${entry.id}`);

    expect(response.status).toBe(401);
  });

  it("refuses another student's prize", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioAward();

    const response = await request(app)
      .get(`/portfolio-award/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-award/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no prize", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-award/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบรางวัลที่ต้องการ",
    });
  });
});

describe("POST /portfolio-award", () => {
  it("creates a prize and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-award")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
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
      .set("Cookie", sessionCookie({ userId: student.student_id }))
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
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "การแข่งขันไร้วันที่");

    expect(response.status).toBe(201);
    expect(response.body.data.date).toBeNull();
  });

  it("uploads the files and hangs them off the prize", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-award")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "การแข่งขันตัวอย่าง")
      .attach("files", PDF, "certificate.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.attachments).toHaveLength(1);

    const objects = await listStoredObjects("portfolio-award/");
    expect(objects).toContain(
      signedFileKey(response.body.data.attachments[0].file_path),
    );
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-award")
      .field("name", "การแข่งขันไร้เจ้าของ");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.portfolio_award.count({
        where: { name: "การแข่งขันไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("refuses a date and a flag it cannot read", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-award")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "การแข่งขันตัวอย่าง")
      .field("date", "เมื่อวาน")
      .field("is_show", "maybe");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        field: "date",
        location: "body",
        message: "ต้องเป็นวันที่ที่ถูกต้อง",
      },
      {
        field: "is_show",
        location: "body",
        message: "ต้องเป็นค่า true หรือ false",
      },
    ]);
    expect(
      await prisma.portfolio_award.count({
        where: { user_id: student.student_id },
      }),
    ).toBe(0);
  });

  it("refuses a session for a user who does not exist", async () => {
    // See BEHAVIOR-CHANGES.md. The write used to go straight at the table and
    // come back as a 500 from the foreign key; requireUser now looks the
    // account up before anything is written.
    const response = await request(app)
      .post("/portfolio-award")
      .set("Cookie", sessionCookie({ userId: "99999999" }))
      .field("name", "การแข่งขันไร้เจ้าของ");

    expect(response.status).toBe(401);
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
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
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
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ name: "การแข่งขันใหม่" });

    expect(response.body.data.is_show).toBe(true);
  });

  it("clears the date when the request sends an empty one", async () => {
    const entry = await createPortfolioAward({ date: new Date("2024-03-01") });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ date: "" });

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBeNull();
  });

  it("leaves the date alone when the request says nothing about it", async () => {
    const entry = await createPortfolioAward({ date: new Date("2024-03-01") });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBe("2024-03-01T00:00:00.000Z");
  });

  it("deletes the attachment ids_to_delete names", async () => {
    const dropped = await createFileAttachment();
    const kept = await createFileAttachment();
    const entry = await createPortfolioAward({
      attachment_ids: [dropped.attachment_id, kept.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .send({ ids_to_delete: [dropped.attachment_id] });

    expect(response.status).toBe(200);
    expect(
      response.body.data.attachments.map(
        (a: { attachment_id: number }) => a.attachment_id,
      ),
    ).toEqual([kept.attachment_id]);

    // Losing its last owner takes the attachment with it (#34).
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: dropped.attachment_id },
      }),
    ).toBeNull();
  });

  it("refuses a request with no session, and changes nothing", async () => {
    const entry = await createPortfolioAward({ name: "การแข่งขันเดิม" });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(401);
    expect(
      (
        await prisma.portfolio_award.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("การแข่งขันเดิม");
  });

  it("refuses another student's prize, and changes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioAward({ name: "การแข่งขันเดิม" });

    const response = await request(app)
      .put(`/portfolio-award/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_award.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("การแข่งขันเดิม");
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-award/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a prize that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-award/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "การแข่งขันใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-award/:id", () => {
  it("removes the prize, its join rows and what they pointed at", async () => {
    const student = await createStudent();
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioAward({
      user_id: student.student_id,
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioAward({ user_id: student.student_id });

    const response = await request(app)
      .delete(`/portfolio-award/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

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
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: attachment.attachment_id },
      }),
    ).toBeNull();
  });

  it("refuses a request with no session, and deletes nothing", async () => {
    const entry = await createPortfolioAward();

    const response = await request(app).delete(`/portfolio-award/${entry.id}`);

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_award.findUnique({ where: { id: entry.id } }),
    ).not.toBeNull();
  });

  it("refuses another student's prize, and deletes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioAward();

    const response = await request(app)
      .delete(`/portfolio-award/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_award.findUnique({ where: { id: entry.id } }),
    ).not.toBeNull();
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-award/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a prize that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-award/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
