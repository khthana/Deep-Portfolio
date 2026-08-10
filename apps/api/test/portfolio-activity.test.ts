import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createLinkAttachment,
  createPortfolioActivity,
  createStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";

/**
 * What the student did outside their coursework — /portfolio-activity.
 *
 * Camps, clubs, volunteering. Not the `activities` table, which is work a
 * teacher sets; the two are unrelated despite the name, and this one is
 * portfolio_activities.
 *
 * `name` is the one NOT NULL column besides the ids, so a POST that omits it is
 * a 500. The controller is the only one in the group that normalises the date
 * itself — an empty string is dropped rather than sent on as one — which is
 * what keeps a blank date field from reaching Prisma as an Invalid Date.
 *
 * Authorisation is the same everywhere in the group since #31 — a session, and
 * your own rows — and portfolio-education.test.ts carries those cases in full.
 */

const PDF = Buffer.from("%PDF-1.4 example");

describe("GET /portfolio-activity", () => {
  it("returns the student's activities, most recent first", async () => {
    const student = await createStudent();
    const earlier = await createPortfolioActivity({
      user_id: student.student_id,
      name: "ค่ายอาสาแรก",
      date: new Date("2023-10-01"),
    });
    const later = await createPortfolioActivity({
      user_id: student.student_id,
      name: "ค่ายอาสาที่สอง",
      date: new Date("2024-10-01"),
    });

    const response = await request(app)
      .get("/portfolio-activity")
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
      name: "ค่ายอาสาแรก",
      date: "2023-10-01T00:00:00.000Z",
      role: null,
      description: null,
      is_show: true,
      attachments: [],
    });
  });

  it("returns the attachments hanging off an activity", async () => {
    const student = await createStudent();
    const file = await createFileAttachment({
      original_filename: "photo.png",
      file_path: "portfolio-activity/1-2-photo.png",
      file_size: 512,
    });
    const link = await createLinkAttachment({
      title: "หน้ากิจกรรม",
      url: "https://example.test/camp",
    });
    await createPortfolioActivity({
      user_id: student.student_id,
      attachment_ids: [file.attachment_id, link.attachment_id],
    });

    const response = await request(app)
      .get("/portfolio-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data[0].attachments).toEqual([
      {
        attachment_id: file.attachment_id,
        url: "portfolio-activity/1-2-photo.png",
        file_path: "portfolio-activity/1-2-photo.png",
        original_filename: "photo.png",
        file_size: 512,
      },
      {
        attachment_id: link.attachment_id,
        url: "https://example.test/camp",
        file_path: null,
        original_filename: "หน้ากิจกรรม",
        file_size: null,
      },
    ]);
  });

  it("leaves out another student's activities", async () => {
    const student = await createStudent();
    const mine = await createPortfolioActivity({ user_id: student.student_id });
    await createPortfolioActivity();

    const response = await request(app)
      .get("/portfolio-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data.map((a: { id: number }) => a.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /portfolio-activity/:id", () => {
  it("returns the activity the id names", async () => {
    const entry = await createPortfolioActivity({
      name: "ค่ายอาสาตัวอย่าง",
      role: "ประธานค่าย",
    });

    const response = await request(app)
      .get(`/portfolio-activity/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ค่ายอาสาตัวอย่าง",
      role: "ประธานค่าย",
    });
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-activity/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no activity", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-activity/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบกิจกรรมที่ต้องการ",
    });
  });
});

describe("POST /portfolio-activity", () => {
  it("creates an activity and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ค่ายอาสาตัวอย่าง")
      .field("role", "ประธานค่าย")
      .field("date", "2024-10-01")
      .field("is_show", "true");

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      name: "ค่ายอาสาตัวอย่าง",
      role: "ประธานค่าย",
      date: "2024-10-01T00:00:00.000Z",
      is_show: true,
      attachments: [],
    });

    const stored = await prisma.portfolio_activities.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].role).toBe("ประธานค่าย");
  });

  it("drops an empty date rather than sending it on", async () => {
    // An empty field is what the form sends for a date the student left blank.
    // Passed through it would reach Prisma as an Invalid Date; the controller
    // deletes the key instead, so the column simply stays null.
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ค่ายอาสาไร้วันที่")
      .field("date", "")
      .field("is_show", "");

    expect(response.status).toBe(201);
    expect(response.body.data.date).toBeNull();
    // is_show was dropped too, so the column's default applies.
    expect(response.body.data.is_show).toBe(true);
  });

  it("uploads the files and hangs them off the activity", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ค่ายอาสาตัวอย่าง")
      .attach("files", PDF, "photo.pdf");

    expect(response.status).toBe(201);
    expect(response.body.data.attachments).toHaveLength(1);

    const objects = await listStoredObjects("portfolio-activity/");
    expect(objects).toContain(response.body.data.attachments[0].file_path);
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-activity")
      .field("name", "ค่ายอาสาไร้เจ้าของ");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.portfolio_activities.count({
        where: { name: "ค่ายอาสาไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("fails when the request names no activity", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-activity")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("role", "ประธานค่าย");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: name ต้องระบุ",
      errors: [{ field: "name", location: "body", message: "ต้องระบุ" }],
    });
    expect(
      await prisma.portfolio_activities.count({
        where: { user_id: student.student_id },
      }),
    ).toBe(0);
  });
});

describe("PUT /portfolio-activity/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const entry = await createPortfolioActivity({
      name: "ค่ายอาสาเดิม",
      role: "สมาชิก",
    });

    const response = await request(app)
      .put(`/portfolio-activity/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .field("name", "ค่ายอาสาใหม่");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: entry.id,
      name: "ค่ายอาสาใหม่",
      role: "สมาชิก",
    });
    expect(
      (
        await prisma.portfolio_activities.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("ค่ายอาสาใหม่");
  });

  it("clears the date when the request sends an empty one", async () => {
    // See BEHAVIOR-CHANGES.md. The empty date used to be dropped before it
    // reached the service, so a student could not take out a date they had
    // entered by mistake. The schema now reads "" as the instruction to clear.
    const entry = await createPortfolioActivity({
      date: new Date("2024-10-01"),
    });

    const response = await request(app)
      .put(`/portfolio-activity/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .field("date", "");

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBeNull();
  });

  it("leaves the date alone when the request says nothing about it", async () => {
    const entry = await createPortfolioActivity({
      date: new Date("2024-10-01"),
    });

    const response = await request(app)
      .put(`/portfolio-activity/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: entry.user_id }))
      .field("name", "ค่ายอาสาใหม่");

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBe("2024-10-01T00:00:00.000Z");
  });

  it("drops the join row ids_to_delete names and leaves the attachment", async () => {
    const dropped = await createFileAttachment();
    const kept = await createFileAttachment();
    const entry = await createPortfolioActivity({
      attachment_ids: [dropped.attachment_id, kept.attachment_id],
    });

    const response = await request(app)
      .put(`/portfolio-activity/${entry.id}`)
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

  it("refuses another student's activity, and changes nothing", async () => {
    const stranger = await createStudent();
    const entry = await createPortfolioActivity({ name: "ค่ายอาสาเดิม" });

    const response = await request(app)
      .put(`/portfolio-activity/${entry.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .field("name", "ค่ายอาสาใหม่");

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_activities.findUniqueOrThrow({
          where: { id: entry.id },
        })
      ).name,
    ).toBe("ค่ายอาสาเดิม");
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-activity/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ค่ายอาสาใหม่");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for an activity that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-activity/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("name", "ค่ายอาสาใหม่");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-activity/:id", () => {
  it("removes the activity and its join rows", async () => {
    const student = await createStudent();
    const attachment = await createFileAttachment();
    const doomed = await createPortfolioActivity({
      user_id: student.student_id,
      attachment_ids: [attachment.attachment_id],
    });
    const kept = await createPortfolioActivity({
      user_id: student.student_id,
    });

    const response = await request(app)
      .delete(`/portfolio-activity/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_activities.findMany({
        where: { user_id: student.student_id },
      }),
    ).toHaveLength(1);
    expect(
      await prisma.portfolio_activities.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_activity_attachments.findMany({
        where: { activity_id: doomed.id },
      }),
    ).toHaveLength(0);
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-activity/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for an activity that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-activity/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
