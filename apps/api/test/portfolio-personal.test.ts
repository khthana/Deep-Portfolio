import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createFileAttachment,
  createPortfolioPersonal,
  createStudent,
} from "./factories";
import { sessionCookie } from "./helpers/session";
import { listStoredObjects } from "./helpers/storage";
import { signedFileUrl } from "./helpers/file-url";

/**
 * Personal details — /portfolio-personal.
 *
 * One row per user: user_id is the primary key, not just a foreign key, which
 * is why this is the only part of the portfolio with an upsert endpoint and
 * why posting twice for the same student is a failure rather than a second
 * entry.
 *
 * Email and telephone are the odd pair here. They exist on `users` already,
 * having been filled in when the account was made, so the read endpoint falls
 * back to those when the portfolio's own copy is empty — and the write side
 * treats an empty string as "clear this" for those two fields alone, where
 * everywhere else an empty string means null.
 *
 * Being keyed on the student is also why ownership here is `requireSelf`
 * against the path rather than a lookup by row id (#31): every route but the
 * create names the student it acts for, and it has to be the caller. See
 * docs/adr/0001-portfolio-access.md.
 */

const IMAGE = Buffer.from("\x89PNG\r\n\x1a\n example");

describe("GET /portfolio-personal/:user_id", () => {
  it("returns the details the student has entered", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({
      user_id: student.student_id,
      date_of_birth: new Date("2003-05-17"),
      nationality: "ไทย",
      race: "ไทย",
      github: "https://example.test/somying",
      linkedin: "https://example.test/in/somying",
      email: "somying@example.test",
      phone_number: "021111111",
    });

    const response = await request(app)
      .get(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      user_id: student.student_id,
      date_of_birth: "2003-05-17T00:00:00.000Z",
      nationality: "ไทย",
      race: "ไทย",
      github: "https://example.test/somying",
      linkedin: "https://example.test/in/somying",
      email: "somying@example.test",
      phone_number: "021111111",
      attachment_id: null,
      attachments: null,
    });
  });

  it("falls back to the account's email and telephone", async () => {
    // The row exists but those two columns are empty, which is what a student
    // who has never edited them looks like. See BEHAVIOR-CHANGES.md — this
    // fallback was written but discarded before the response was built.
    const student = await createStudent({
      email: "account@example.test",
      phone: "029999999",
    });
    await createPortfolioPersonal({
      user_id: student.student_id,
      email: null,
      phone_number: null,
    });

    const response = await request(app)
      .get(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.body.data).toMatchObject({
      email: "account@example.test",
      phone_number: "029999999",
    });
  });

  it("does not hand back the account row the fallback came from", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({ user_id: student.student_id });

    const response = await request(app)
      .get(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.body.data).not.toHaveProperty("users");
  });

  it("answers with the account's details for a student who has entered none", async () => {
    const student = await createStudent({
      email: "no-details@example.test",
      phone: "028888888",
    });

    const response = await request(app)
      .get(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      user_id: student.student_id,
      email: "no-details@example.test",
      phone_number: "028888888",
      date_of_birth: null,
      nationality: null,
      race: null,
      github: null,
      linkedin: null,
      attachment_id: null,
      attachments: null,
    });
    expect(
      await prisma.portfolio_personal.findUnique({
        where: { user_id: student.student_id },
      }),
    ).toBeNull();
  });

  it("returns the attachment behind the profile picture", async () => {
    const student = await createStudent();
    const picture = await createFileAttachment({
      original_filename: "profile.png",
      file_path: "portfolio-personal/1-2-profile.png",
      file_type: "PNG",
    });
    await createPortfolioPersonal({
      user_id: student.student_id,
      attachment_id: picture.attachment_id,
    });

    const response = await request(app)
      .get(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.body.data.attachments).toEqual({
      attachment_id: picture.attachment_id,
      url: signedFileUrl("portfolio-personal/1-2-profile.png"),
      file_path: signedFileUrl("portfolio-personal/1-2-profile.png"),
    });
  });

  it("refuses a request with no session", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({ user_id: student.student_id });

    const response = await request(app).get(
      `/portfolio-personal/${student.student_id}`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses another student's details", async () => {
    // See BEHAVIOR-CHANGES.md. The path was the only thing that decided whose
    // details came back — date of birth, telephone, email and all.
    const owner = await createStudent();
    const stranger = await createStudent();
    await createPortfolioPersonal({ user_id: owner.student_id });

    const response = await request(app)
      .get(`/portfolio-personal/${owner.student_id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
    });
  });

  it("refuses a user who does not exist", async () => {
    // See BEHAVIOR-CHANGES.md. This used to be a 404 — and before #20, a 200
    // carrying null. A session is now needed first, and requireUser will not
    // hand one out for an account that is not there, so the controller's 404
    // is no longer reachable through this route.
    const response = await request(app)
      .get("/portfolio-personal/99999999")
      .set("Cookie", sessionCookie({ userId: "99999999" }));

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });
});

describe("POST /portfolio-personal", () => {
  it("creates the details and hands them back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-personal")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("nationality", "ไทย")
      .field("github", "https://example.test/somying");

    expect(response.status).toBe(201);
    // Every key: the row as it was written, and no `attachments` beside it.
    // The read builds that field from the attachment the row points at; a
    // write hands back what Prisma returned, which has no such key at all —
    // absent, not null (#68).
    expect(response.body.data).toEqual({
      user_id: student.student_id,
      nationality: "ไทย",
      github: "https://example.test/somying",
      date_of_birth: null,
      race: null,
      linkedin: null,
      email: null,
      phone_number: null,
      attachment_id: null,
    });
    expect(response.body.data).not.toHaveProperty("attachments");

    const stored = await prisma.portfolio_personal.findUniqueOrThrow({
      where: { user_id: student.student_id },
    });
    expect(stored.nationality).toBe("ไทย");
  });

  it("writes the details for the signed-in student, whatever the body says", async () => {
    const caller = await createStudent();
    const stranger = await createStudent();

    const response = await request(app)
      .post("/portfolio-personal")
      .set("Cookie", sessionCookie({ userId: caller.student_id }))
      .field("user_id", stranger.student_id)
      .field("nationality", "ไทย");

    expect(response.status).toBe(201);
    expect(response.body.data.user_id).toBe(caller.student_id);
    expect(
      await prisma.portfolio_personal.count({
        where: { user_id: stranger.student_id },
      }),
    ).toBe(0);
  });

  it("uploads the profile picture and points the row at it", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-personal")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .attach("file", IMAGE, "profile.png");

    expect(response.status).toBe(201);

    const stored = await prisma.portfolio_personal.findUniqueOrThrow({
      where: { user_id: student.student_id },
    });
    expect(stored.attachment_id).not.toBeNull();

    const attachment = await prisma.attachments.findUniqueOrThrow({
      where: { attachment_id: stored.attachment_id! },
    });
    expect(attachment).toMatchObject({
      attachment_type: "file",
      original_filename: "profile.png",
      file_size: BigInt(IMAGE.length),
      file_type: "PNG",
    });

    const objects = await listStoredObjects("portfolio-personal/");
    expect(objects).toContain(attachment.file_path);
  });

  it("reads the word null as an empty field", async () => {
    // Multipart carries strings and nothing else, so the frontend sends the
    // four letters n-u-l-l for a field the student cleared. An empty string
    // means the same thing — except for email and telephone, where it is kept
    // as an empty string so the read endpoint's fallback does not undo the
    // clearing.
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-personal")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("github", "null")
      .field("race", "")
      .field("email", "")
      .field("phone_number", "");

    expect(response.status).toBe(201);

    const stored = await prisma.portfolio_personal.findUniqueOrThrow({
      where: { user_id: student.student_id },
    });
    expect(stored.github).toBeNull();
    expect(stored.race).toBeNull();
    expect(stored.email).toBe("");
    expect(stored.phone_number).toBe("");
  });

  it("stores nothing in the bucket when there is no session", async () => {
    const before = await listStoredObjects("portfolio-personal/");

    const response = await request(app)
      .post("/portfolio-personal")
      .field("github", "https://example.test/no-owner")
      .attach("file", IMAGE, "profile.png");

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_personal.count({
        where: { github: "https://example.test/no-owner" },
      }),
    ).toBe(0);
    expect(await listStoredObjects("portfolio-personal/")).toEqual(before);
  });

  it("fails when the student already has details", async () => {
    // Still a 500 where PUT and DELETE became 404s: user_id is unique, so this
    // is P2002, and #42 mapped P2025 alone. A row that is already there is not
    // a row that is missing, and it has no answer of its own yet.
    const student = await createStudent();
    await createPortfolioPersonal({
      user_id: student.student_id,
      nationality: "ไทย",
    });

    const response = await request(app)
      .post("/portfolio-personal")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("nationality", "ลาว");

    expect(response.status).toBe(500);
    expect(
      (
        await prisma.portfolio_personal.findUniqueOrThrow({
          where: { user_id: student.student_id },
        })
      ).nationality,
    ).toBe("ไทย");
  });
});

describe("PUT /portfolio-personal/:user_id", () => {
  it("overwrites the fields the request carries", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({
      user_id: student.student_id,
      nationality: "ไทย",
      github: "https://example.test/old",
    });

    const response = await request(app)
      .put(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("github", "https://example.test/new");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      nationality: "ไทย",
      github: "https://example.test/new",
    });
    // The row alone, the same as the create (#68).
    expect(response.body.data).not.toHaveProperty("attachments");
  });

  it("replaces the profile picture and takes the old one with it", async () => {
    // The row holds one picture, so pointing it at a new upload is the last
    // anyone could reach the old one by: it goes with the pointer (#34).
    const student = await createStudent();

    await request(app)
      .post("/portfolio-personal")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .attach("file", IMAGE, "old.png");

    const before = await prisma.portfolio_personal.findUniqueOrThrow({
      where: { user_id: student.student_id },
    });
    const old = await prisma.attachments.findUniqueOrThrow({
      where: { attachment_id: before.attachment_id! },
    });

    const response = await request(app)
      .put(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .attach("file", IMAGE, "new.png");

    expect(response.status).toBe(200);

    const after = await prisma.portfolio_personal.findUniqueOrThrow({
      where: { user_id: student.student_id },
    });
    expect(after.attachment_id).not.toBe(before.attachment_id);

    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: before.attachment_id! },
      }),
    ).toBeNull();
    expect(await listStoredObjects("portfolio-personal/")).not.toContain(
      old.file_path,
    );
  });

  it("refuses a date of birth it cannot read", async () => {
    // See BEHAVIOR-CHANGES.md. The service used to hand the string to Prisma
    // after `new Date(…)` had made an Invalid Date of it, which came back as a
    // 500 about the query rather than a 400 about the field.
    const student = await createStudent();
    await createPortfolioPersonal({ user_id: student.student_id });

    const response = await request(app)
      .put(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("date_of_birth", "เมื่อวาน");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message:
        "ข้อมูลที่ส่งมาไม่ถูกต้อง: date_of_birth ต้องเป็นวันที่ที่ถูกต้อง",
      errors: [
        {
          field: "date_of_birth",
          location: "body",
          message: "ต้องเป็นวันที่ที่ถูกต้อง",
        },
      ],
    });
  });

  it("clears the date of birth when the request sends an empty one", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({
      user_id: student.student_id,
      date_of_birth: new Date("2003-05-14"),
    });

    const response = await request(app)
      .put(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("date_of_birth", "");

    expect(response.status).toBe(200);
    expect(response.body.data.date_of_birth).toBeNull();
  });

  it("refuses a request with no session, and changes nothing", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({
      user_id: student.student_id,
      nationality: "ไทย",
    });

    const response = await request(app)
      .put(`/portfolio-personal/${student.student_id}`)
      .field("nationality", "ลาว");

    expect(response.status).toBe(401);
    expect(
      (
        await prisma.portfolio_personal.findUniqueOrThrow({
          where: { user_id: student.student_id },
        })
      ).nationality,
    ).toBe("ไทย");
  });

  it("refuses another student's details, and changes nothing", async () => {
    const owner = await createStudent();
    const stranger = await createStudent();
    await createPortfolioPersonal({
      user_id: owner.student_id,
      nationality: "ไทย",
    });

    const response = await request(app)
      .put(`/portfolio-personal/${owner.student_id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .field("nationality", "ลาว");

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_personal.findUniqueOrThrow({
          where: { user_id: owner.student_id },
        })
      ).nationality,
    ).toBe("ไทย");
  });

  it("answers 404 for a student who has no details yet", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("nationality", "ไทย");

    // P2025 used to leave here as a 500, telling the caller the server had
    // broken over a row that is merely absent (#42). It now says what GET says
    // about the same missing row.
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลส่วนตัวของผู้ใช้รายนี้",
    });

    expect(
      await prisma.portfolio_personal.findUnique({
        where: { user_id: student.student_id },
      }),
    ).toBeNull();
  });
});

describe("POST /portfolio-personal/:user_id/upsert", () => {
  it("creates the details when there are none", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post(`/portfolio-personal/${student.student_id}/upsert`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("nationality", "ไทย");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      nationality: "ไทย",
    });
    expect(response.body.data).not.toHaveProperty("attachments");
    expect(
      await prisma.portfolio_personal.count({
        where: { user_id: student.student_id },
      }),
    ).toBe(1);
  });

  it("overwrites the details when there are some", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({
      user_id: student.student_id,
      nationality: "ไทย",
      github: "https://example.test/old",
    });

    const response = await request(app)
      .post(`/portfolio-personal/${student.student_id}/upsert`)
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .field("github", "https://example.test/new");

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      nationality: "ไทย",
      github: "https://example.test/new",
    });
    expect(response.body.data).not.toHaveProperty("attachments");
    expect(
      await prisma.portfolio_personal.count({
        where: { user_id: student.student_id },
      }),
    ).toBe(1);
  });

  it("refuses another student's details, and writes nothing", async () => {
    const owner = await createStudent();
    const stranger = await createStudent();

    const response = await request(app)
      .post(`/portfolio-personal/${owner.student_id}/upsert`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .field("nationality", "ไทย");

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_personal.findUnique({
        where: { user_id: owner.student_id },
      }),
    ).toBeNull();
  });

  it("refuses a user who does not exist", async () => {
    // The write used to reach the table and come back as a 500 from the
    // foreign key; there is no session to be had for an account that is gone.
    const response = await request(app)
      .post("/portfolio-personal/99999999/upsert")
      .set("Cookie", sessionCookie({ userId: "99999999" }))
      .field("nationality", "ไทย");

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_personal.findUnique({
        where: { user_id: "99999999" },
      }),
    ).toBeNull();
  });
});

describe("DELETE /portfolio-personal/:user_id", () => {
  it("removes the details and leaves the account alone", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({ user_id: student.student_id });

    const response = await request(app)
      .delete(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_personal.findUnique({
        where: { user_id: student.student_id },
      }),
    ).toBeNull();
    expect(
      await prisma.users.findUnique({ where: { user_id: student.student_id } }),
    ).not.toBeNull();
  });

  it("removes the profile picture along with the details", async () => {
    // portfolio_personal.attachment_id is the only pointer at the picture, so
    // dropping the row is what strands it (#34).
    const student = await createStudent();

    await request(app)
      .post("/portfolio-personal")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .attach("file", IMAGE, "profile.png");

    const stored = await prisma.portfolio_personal.findUniqueOrThrow({
      where: { user_id: student.student_id },
    });
    const picture = await prisma.attachments.findUniqueOrThrow({
      where: { attachment_id: stored.attachment_id! },
    });

    const response = await request(app)
      .delete(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(
      await prisma.attachments.findUnique({
        where: { attachment_id: picture.attachment_id },
      }),
    ).toBeNull();
    expect(await listStoredObjects("portfolio-personal/")).not.toContain(
      picture.file_path,
    );
  });

  it("refuses a request with no session, and deletes nothing", async () => {
    const student = await createStudent();
    await createPortfolioPersonal({ user_id: student.student_id });

    const response = await request(app).delete(
      `/portfolio-personal/${student.student_id}`,
    );

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_personal.findUnique({
        where: { user_id: student.student_id },
      }),
    ).not.toBeNull();
  });

  it("refuses another student's details, and deletes nothing", async () => {
    const owner = await createStudent();
    const stranger = await createStudent();
    await createPortfolioPersonal({ user_id: owner.student_id });

    const response = await request(app)
      .delete(`/portfolio-personal/${owner.student_id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_personal.findUnique({
        where: { user_id: owner.student_id },
      }),
    ).not.toBeNull();
  });

  it("answers 404 for a student who has no details", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete(`/portfolio-personal/${student.student_id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบข้อมูลส่วนตัวของผู้ใช้รายนี้",
    });
  });
});
