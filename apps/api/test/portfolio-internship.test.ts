import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createLinkAttachment,
  createPortfolioInternship,
  createStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";
import { signedFileKey, signedFileUrl } from "./helpers/file-url";

/**
 * Where the student worked — /portfolio-internship.
 *
 * Shaped like training and certificate: a list per user, attachments a join
 * table away, uploads on both create and update, and `ids_to_delete` to drop a
 * join row. What is its own here is `type` — the one NOT NULL column besides
 * the ids, holding "internship" or "coop" — and the three is_show_* flags the
 * controller has to convert out of multipart's strings.
 *
 * The list is ordered by start_date descending, which is the only ordering in
 * the group that reads off a column the student may leave blank.
 *
 * Authorisation is the same everywhere in the group since #31 — a session, and
 * your own rows. T5 wants a refusal on every endpoint behind the middleware, so
 * each one here carries a 401, and every one that can name a row or a user
 * other than the caller's carries a 403 as well; the rule is in
 * docs/adr/0001-portfolio-access.md and the shapes are spelled out in
 * portfolio-education.test.ts. The pair this file can get wrong on its own is a
 * multipart create and a multipart update that are refused before the upload.
 */

const PDF = Buffer.from("%PDF-1.4 example");

describe("GET /portfolio-internship", () => {
  it("returns the student's placements, most recent first", async () => {
    const student = await createStudent();
    const earlier = await createPortfolioInternship({
      user_id: student.student_id,
      type: "internship",
      company: "บริษัทแรก",
      start_date: new Date("2023-06-01"),
      end_date: new Date("2023-08-31"),
    });
    const later = await createPortfolioInternship({
      user_id: student.student_id,
      type: "coop",
      company: "บริษัทที่สอง",
      start_date: new Date("2024-06-01"),
    });

    const response = await request(app)
      .get("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((i: { id: number }) => i.id)).toEqual([
      later.id,
      earlier.id,
    ]);
    expect(response.body.data[1]).toEqual({
      id: earlier.id,
      user_id: student.student_id,
      type: "internship",
      title: "ฝึกงานตัวอย่าง",
      company: "บริษัทแรก",
      country: null,
      province: null,
      start_date: "2023-06-01T00:00:00.000Z",
      end_date: "2023-08-31T00:00:00.000Z",
      position: null,
      resp: null,
      is_show_resp: true,
      learning_out: null,
      is_show_learning: true,
      reflection: null,
      is_show_reflec: true,
      attachments: [],
    });
  });

  it("returns the attachments hanging off a placement", async () => {
    const student = await createStudent();
    const file = await createFileAttachment({
      original_filename: "evaluation.pdf",
      file_path: "portfolio-internship/1-2-evaluation.pdf",
      file_size: 4096,
    });
    const link = await createLinkAttachment({
      title: "หน้าบริษัท",
      url: "https://example.test/company",
    });
    await createPortfolioInternship({
      user_id: student.student_id,
      attachment_ids: [file.attachment_id, link.attachment_id],
    });

    const response = await request(app)
      .get("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    // Files first, then links — the endpoint concatenates the two lists the
    // attachments service splits the rows into.
    expect(response.body.data[0].attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: signedFileUrl("portfolio-internship/1-2-evaluation.pdf"),
        file_path: signedFileUrl("portfolio-internship/1-2-evaluation.pdf"),
        original_filename: "evaluation.pdf",
        file_size: 4096,
      },
      {
        attachment_id: link.attachment_id,
        url: "https://example.test/company",
        file_path: null,
        original_filename: "หน้าบริษัท",
        file_size: null,
      },
    ]);
  });

  it("leaves out another student's placements", async () => {
    const student = await createStudent();
    const mine = await createPortfolioInternship({
      user_id: student.student_id,
    });
    await createPortfolioInternship();

    const response = await request(app)
      .get("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data.map((i: { id: number }) => i.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request with no session", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-internship")
      .query({ user_id: student.student_id });

    expect(response.status).toBe(401);
  });

  it("refuses a student asking for somebody else's placements", async () => {
    const owner = await createStudent();
    const stranger = await createStudent();
    await createPortfolioInternship({ user_id: owner.student_id });

    const response = await request(app)
      .get("/portfolio-internship")
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
      .get("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /portfolio-internship/:id", () => {
  it("returns the placement the id names", async () => {
    const entry = await createPortfolioInternship({
      company: "บริษัทตัวอย่าง",
      position: "นักพัฒนาซอฟต์แวร์",
    });

    const response = await request(app)
      .get(`/portfolio-internship/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      company: "บริษัทตัวอย่าง",
      position: "นักพัฒนาซอฟต์แวร์",
    });
  });

  it("refuses a request with no session", async () => {
    const entry = await createPortfolioInternship();

    const response = await request(app).get(
      `/portfolio-internship/${entry.id}`,
    );

    expect(response.status).toBe(401);
  });

  it("refuses another student's placement", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioInternship();

    const response = await request(app)
      .get(`/portfolio-internship/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-internship/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no placement", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-internship/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบการฝึกงานที่ต้องการ",
    });
  });
});

describe("POST /portfolio-internship", () => {
  it("creates a placement and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("type", "coop")
      .field("title", "สหกิจศึกษา")
      .field("company", "บริษัทตัวอย่าง")
      .field("start_date", "2024-06-01")
      .field("end_date", "2024-10-31");

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      type: "coop",
      title: "สหกิจศึกษา",
      company: "บริษัทตัวอย่าง",
      start_date: "2024-06-01T00:00:00.000Z",
      end_date: "2024-10-31T00:00:00.000Z",
      attachments: [],
    });

    const stored = await prisma.portfolio_internship.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].company).toBe("บริษัทตัวอย่าง");
  });

  it("reads the is_show flags out of the strings multipart carries", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("type", "internship")
      .field("is_show_resp", "false")
      .field("is_show_learning", "true")
      .field("is_show_reflec", "false");

    expect(response.status).toBe(201);

    const stored = await prisma.portfolio_internship.findFirstOrThrow({
      where: { user_id: student.student_id },
    });
    expect(stored).toMatchObject({
      is_show_resp: false,
      is_show_learning: true,
      is_show_reflec: false,
    });
  });

  it("uploads the files and hangs them off the placement", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("type", "internship")
      .attach("files", PDF, "evaluation.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.attachments).toHaveLength(1);

    const stored = await prisma.portfolio_internship.findFirstOrThrow({
      where: { user_id: student.student_id },
      include: { portfolio_internship_attachments: true },
    });
    expect(stored.portfolio_internship_attachments).toHaveLength(1);

    const objects = await listStoredObjects("portfolio-internship/");
    expect(objects).toContain(
      signedFileKey(response.body.data.attachments[0].file_path),
    );
  });

  it("stores nothing in the bucket when there is no session", async () => {
    // requireUser runs before the upload middleware since #31, so a request
    // nobody is behind never reaches the bucket at all.
    const before = await listStoredObjects("portfolio-internship/");

    const response = await request(app)
      .post("/portfolio-internship")
      .field("type", "internship")
      .field("company", "บริษัทไร้เจ้าของ")
      .attach("files", PDF, "evaluation.pdf");

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_internship.count({
        where: { company: "บริษัทไร้เจ้าของ" },
      }),
    ).toBe(0);
    expect(await listStoredObjects("portfolio-internship/")).toEqual(before);
  });

  it("fails when the request names no type of placement", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-internship")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("company", "บริษัทตัวอย่าง");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: type ต้องระบุ",
      errors: [{ field: "type", location: "body", message: "ต้องระบุ" }],
    });
    expect(
      await prisma.portfolio_internship.count({
        where: { user_id: student.student_id },
      }),
    ).toBe(0);
  });
});

describe("PUT /portfolio-internship/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const entry = await createPortfolioInternship({
      company: "บริษัทเดิม",
      position: "ตำแหน่งเดิม",
    });

    const response = await request(app)
      .put(`/portfolio-internship/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .field("company", "บริษัทใหม่");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      company: "บริษัทใหม่",
      position: "ตำแหน่งเดิม",
    });
    expect(
      (
        await prisma.portfolio_internship.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).company,
    ).toBe("บริษัทใหม่");
  });

  it("adds the uploaded files to the ones already there", async () => {
    const existing = await createFileAttachment();
    const entry = await createPortfolioInternship({
      attachment_ids: [existing.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-internship/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .attach("files", PDF, "extra.pdf");

    expect(response.status).toBe(200);
    expect(response.body.data.attachments).toHaveLength(2);
  });

  it("drops the join row ids_to_delete names and leaves the attachment", async () => {
    // Recorded, not endorsed: only the join row goes. The attachment stays in
    // the table and in the bucket, the same as training and certificate.
    const dropped = await createFileAttachment();
    const kept = await createFileAttachment();
    const entry = await createPortfolioInternship({
      attachment_ids: [dropped.attachment_id, kept.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-internship/${entry.id}`)
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

  it("refuses a request with no session, and changes nothing", async () => {
    const entry = await createPortfolioInternship({ company: "บริษัทเดิม" });

    const response = await request(app)
      .put(`/portfolio-internship/${entry.id}`)
      .field("company", "บริษัทใหม่");

    expect(response.status).toBe(401);
    expect(
      (
        await prisma.portfolio_internship.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).company,
    ).toBe("บริษัทเดิม");
  });

  it("keeps a refused upload out of the bucket", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioInternship({ company: "บริษัทเดิม" });
    const before = await listStoredObjects("portfolio-internship/");

    const response = await request(app)
      .put(`/portfolio-internship/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .attach("files", PDF, "evaluation.pdf");

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_internship.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).company,
    ).toBe("บริษัทเดิม");
    expect(await listStoredObjects("portfolio-internship/")).toEqual(before);
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-internship/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("company", "บริษัทใหม่");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a placement that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-internship/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("company", "บริษัทใหม่");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-internship/:id", () => {
  it("removes the placement and its join rows", async () => {
    const student = await createStudent();
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioInternship({
      user_id: student.student_id,
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioInternship({
      user_id: student.student_id,
    });

    const response = await request(app)
      .delete(`/portfolio-internship/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_internship.findMany({
        where: { user_id: student.student_id },
      }),
    ).toHaveLength(1);
    expect(
      await prisma.portfolio_internship.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_internship_attachments.findMany({
        where: { internship_id: doomed.id },
      }),
    ).toHaveLength(0);
  });

  it("refuses a request with no session, and deletes nothing", async () => {
    const entry = await createPortfolioInternship();

    const response = await request(app).delete(
      `/portfolio-internship/${entry.id}`,
    );

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_internship.findUnique({ where: { id: entry.id } }),
    ).not.toBeNull();
  });

  it("refuses another student's placement, and deletes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioInternship();

    const response = await request(app)
      .delete(`/portfolio-internship/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_internship.findUnique({ where: { id: entry.id } }),
    ).not.toBeNull();
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-internship/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a placement that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-internship/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
