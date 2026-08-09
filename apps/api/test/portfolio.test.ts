import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createPortfolio,
  createPortfolioCertificate,
  createPortfolioEducation,
  createPortfolioPersonal,
  createPortfolioSkill,
  createPortfolioTemplate,
  createPortfolioTraining,
  createStudent,
} from "./factories";

/**
 * The e-Portfolio itself — /portfolio.
 *
 * A portfolio is a cover page: which template, which colours, which sections
 * to show, and which of the student's skills to put on it. The content lives
 * in the tables the other files in this group cover; this one only points at
 * it. That is why the read endpoint returns a small camelCase object and the
 * public one returns everything the student has.
 *
 * Two things about this route group shape almost every case here:
 *
 * - Nothing on it is behind any middleware. Every endpoint takes the user it
 *   is acting for from the query string or the body, so anyone at all can read
 *   or overwrite anyone's portfolio. That is #31, and it is why no case here
 *   sends a cookie — none is looked at.
 * - The id is a uuid column. A well-formed id that belongs to nobody is a 404;
 *   a string that is not a uuid at all is refused by the schema before the
 *   lookup, which is what it used to reach — Postgres rejected the comparison
 *   and the caller was told the server had failed. See BEHAVIOR-CHANGES.md.
 */

/** Well-formed uuids that no case creates a row for. */
const UNUSED_ID = "11111111-1111-4111-8111-111111111111";
const UNUSED_TOKEN = "22222222-2222-4222-8222-222222222222";

describe("GET /portfolio", () => {
  it("returns the portfolios belonging to one user", async () => {
    const student = await createStudent();
    const template = await createPortfolioTemplate({ name: "โมเดิร์นบลู" });
    const skill = await createPortfolioSkill({ user_id: student.student_id });
    const portfolio = await createPortfolio({
      user_id: student.student_id,
      template_id: template.id,
      portfolio_name: "แฟ้มสมัครฝึกงาน",
      template_color: "#0055aa",
      about_me: "สนใจงานพัฒนาเว็บ",
      skill_ids: [skill.id],
    });

    const response = await request(app)
      .get("/portfolio")
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        id: portfolio.id,
        userId: student.student_id,
        templateId: template.id,
        portfolioName: "แฟ้มสมัครฝึกงาน",
        templateColor: "#0055aa",
        about_me: "สนใจงานพัฒนาเว็บ",
        isShowPersonal: true,
        isShowEducation: true,
        isShowTraining: true,
        isShowCertificate: true,
        isShowSkill: true,
        isShowIntern: true,
        isShowThesis: true,
        isShowAward: true,
        isShowActivity: true,
        selectedSkillIds: [skill.id],
        templateName: "โมเดิร์นบลู",
        publicShareToken: portfolio.public_share_token,
        shareExpiresAt: null,
      },
    ]);
  });

  it("leaves out another student's portfolios", async () => {
    const student = await createStudent();
    const mine = await createPortfolio({ user_id: student.student_id });
    await createPortfolio();

    const response = await request(app)
      .get("/portfolio")
      .query({ user_id: student.student_id });

    expect(response.body.data.map((p: { id: string }) => p.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    await createPortfolio();

    const response = await request(app).get("/portfolio");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

/**
 * The one endpoint in this group with no failure case to write. It takes no
 * input at all — no path parameter, no query, no body — so there is no request
 * that it can be sent and refuse, and nothing it depends on that a case can
 * take away. What follows is the success side twice over: what it returns, and
 * that it is still reachable at all.
 */
describe("GET /portfolio/templates", () => {
  it("returns every template there is, oldest first", async () => {
    const modern = await createPortfolioTemplate({ name: "โมเดิร์นบลู" });
    const classic = await createPortfolioTemplate({ name: "คลาสสิก" });

    const response = await request(app).get("/portfolio/templates");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        { id: modern.id, name: "โมเดิร์นบลู" },
        { id: classic.id, name: "คลาสสิก" },
      ]),
    );

    // Ordered by id ascending. Other cases in this file make templates too, so
    // the list is longer than these two — the order is the claim, not the
    // length.
    const ids = response.body.data.map((t: { id: number }) => t.id);
    expect(ids).toEqual([...ids].sort((a: number, b: number) => a - b));
  });

  it("is not swallowed by the portfolio-by-id route", async () => {
    // /:id is registered after /templates and would otherwise match it,
    // looking up a portfolio whose id is the word "templates" and failing on
    // the uuid comparison. The order of the two registrations is the only
    // thing keeping this a 200.
    const response = await request(app).get("/portfolio/templates");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Fetched templates successfully");
  });
});

describe("GET /portfolio/:id", () => {
  it("returns the portfolio the id names", async () => {
    const portfolio = await createPortfolio({
      portfolio_name: "แฟ้มสะสมผลงานปีสี่",
    });

    const response = await request(app).get(`/portfolio/${portfolio.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: portfolio.id,
      userId: portfolio.user_id,
      portfolioName: "แฟ้มสะสมผลงานปีสี่",
      templateName: null,
      selectedSkillIds: [],
    });
  });

  it("answers 404 for an id that belongs to no portfolio", async () => {
    const response = await request(app).get(`/portfolio/${UNUSED_ID}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบแฟ้มสะสมผลงานที่ต้องการ",
    });
  });

  it("answers 400 for an id that is not a uuid", async () => {
    // See BEHAVIOR-CHANGES.md. This used to be a 500: the 404 above was only
    // reachable for a well-formed id, and anything else failed in Postgres
    // before the controller got to decide.
    const response = await request(app).get("/portfolio/not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นรหัส UUID",
      errors: [
        { field: "id", location: "params", message: "ต้องเป็นรหัส UUID" },
      ],
    });
  });
});

describe("GET /portfolio/public/:token", () => {
  it("returns the whole portfolio to a caller with the link", async () => {
    const student = await createStudent({
      first_name_th: "มานี",
      last_name_th: "มีนา",
    });
    const token = "33333333-3333-4333-8333-333333333333";
    await createPortfolio({
      user_id: student.student_id,
      public_share_token: token,
      portfolio_name: "แฟ้มสาธารณะ",
    });
    await createPortfolioPersonal({
      user_id: student.student_id,
      github: "https://example.test/manee",
    });
    await createPortfolioEducation({
      user_id: student.student_id,
      institution: "โรงเรียนตัวอย่าง",
    });
    await createPortfolioTraining({
      user_id: student.student_id,
      name: "อบรมความปลอดภัย",
    });
    await createPortfolioCertificate({
      user_id: student.student_id,
      name: "ประกาศนียบัตรภาษาอังกฤษ",
    });

    const response = await request(app).get(`/portfolio/public/${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.portfolioConfig).toMatchObject({
      userId: student.student_id,
      portfolioName: "แฟ้มสาธารณะ",
      publicShareToken: token,
    });
    expect(response.body.data.userData).toMatchObject({
      student_id: student.student_id,
      full_name_th: "มานี มีนา",
    });
    expect(response.body.data.portfolioPersonalData).toMatchObject({
      github: "https://example.test/manee",
    });
    expect(
      response.body.data.educationData.map((e: { institution: string }) => e.institution),
    ).toEqual(["โรงเรียนตัวอย่าง"]);
    expect(
      response.body.data.trainingData.map((t: { name: string }) => t.name),
    ).toEqual(["อบรมความปลอดภัย"]);
    expect(
      response.body.data.certificateData.map((c: { name: string }) => c.name),
    ).toEqual(["ประกาศนียบัตรภาษาอังกฤษ"]);
    expect(response.body.data.realWorks).toEqual([]);
  });

  it("shows only the sections belonging to the portfolio's owner", async () => {
    const student = await createStudent();
    const token = "44444444-4444-4444-8444-444444444444";
    await createPortfolio({
      user_id: student.student_id,
      public_share_token: token,
    });
    await createPortfolioTraining({
      user_id: student.student_id,
      name: "อบรมของเจ้าของแฟ้ม",
    });
    await createPortfolioTraining({ name: "อบรมของคนอื่น" });

    const response = await request(app).get(`/portfolio/public/${token}`);

    expect(
      response.body.data.trainingData.map((t: { name: string }) => t.name),
    ).toEqual(["อบรมของเจ้าของแฟ้ม"]);
  });

  it("answers 404 for a token that opens nothing", async () => {
    await createPortfolio();

    const response = await request(app).get(`/portfolio/public/${UNUSED_TOKEN}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบแฟ้มสะสมผลงานที่ต้องการ",
    });
  });

  it("answers 400 for a token that is not a uuid", async () => {
    const response = await request(app).get("/portfolio/public/not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: token ต้องเป็นรหัส UUID",
      errors: [
        { field: "token", location: "params", message: "ต้องเป็นรหัส UUID" },
      ],
    });
  });

  it("answers 410 once the link has expired", async () => {
    const student = await createStudent();
    const token = "55555555-5555-4555-8555-555555555555";
    await createPortfolio({
      user_id: student.student_id,
      public_share_token: token,
      share_expires_at: new Date("2020-01-01T00:00:00Z"),
    });

    const response = await request(app).get(`/portfolio/public/${token}`);

    expect(response.status).toBe(410);
    expect(response.body).toEqual({
      success: false,
      message: "ลิงก์นี้หมดอายุแล้ว",
    });
  });

  it("still opens a link whose expiry is in the future", async () => {
    const student = await createStudent();
    const token = "66666666-6666-4666-8666-666666666666";
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await createPortfolio({
      user_id: student.student_id,
      public_share_token: token,
      share_expires_at: expires,
    });

    const response = await request(app).get(`/portfolio/public/${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.portfolioConfig.shareExpiresAt).toBe(
      expires.toISOString(),
    );
  });
});

describe("POST /portfolio/:id/generate-share-link", () => {
  it("issues a new token and forgets the old one", async () => {
    const portfolio = await createPortfolio({
      public_share_token: "77777777-7777-4777-8777-777777777777",
    });

    const response = await request(app)
      .post(`/portfolio/${portfolio.id}/generate-share-link`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.publicShareToken).not.toBe(
      portfolio.public_share_token,
    );
    expect(response.body.data.shareExpiresAt).toBeNull();

    // The old link stops working the moment a new one is issued.
    const old = await request(app).get(
      `/portfolio/public/${portfolio.public_share_token}`,
    );
    expect(old.status).toBe(404);
  });

  it("records the expiry the caller asked for", async () => {
    const portfolio = await createPortfolio();
    const expiresAt = "2030-06-01T00:00:00.000Z";

    const response = await request(app)
      .post(`/portfolio/${portfolio.id}/generate-share-link`)
      .send({ expiresAt });

    expect(response.status).toBe(200);
    expect(response.body.data.shareExpiresAt).toBe(expiresAt);
    expect(
      (
        await prisma.portfolio.findUniqueOrThrow({
          where: { id: portfolio.id },
        })
      ).share_expires_at,
    ).toEqual(new Date(expiresAt));
  });

  it("refuses an expiry it cannot read", async () => {
    const portfolio = await createPortfolio();

    const response = await request(app)
      .post(`/portfolio/${portfolio.id}/generate-share-link`)
      .send({ expiresAt: "สิ้นเดือน" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: expiresAt ต้องเป็นวันที่ที่ถูกต้อง",
      errors: [
        {
          field: "expiresAt",
          location: "body",
          message: "ต้องเป็นวันที่ที่ถูกต้อง",
        },
      ],
    });
    expect(
      (
        await prisma.portfolio.findUniqueOrThrow({
          where: { id: portfolio.id },
        })
      ).public_share_token,
    ).toBe(portfolio.public_share_token);
  });

  it("fails for a portfolio that does not exist", async () => {
    const response = await request(app)
      .post(`/portfolio/${UNUSED_ID}/generate-share-link`)
      .send({});

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("POST /portfolio", () => {
  it("creates a portfolio and hands it back", async () => {
    const student = await createStudent();
    const template = await createPortfolioTemplate({ name: "คลาสสิก" });

    const response = await request(app).post("/portfolio").send({
      user_id: student.student_id,
      template_id: template.id,
      portfolio_name: "แฟ้มใหม่",
      template_color: "#112233",
      about_me: "แนะนำตัว",
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      userId: student.student_id,
      templateId: template.id,
      portfolioName: "แฟ้มใหม่",
      templateColor: "#112233",
      about_me: "แนะนำตัว",
      templateName: "คลาสสิก",
      selectedSkillIds: [],
    });

    const stored = await prisma.portfolio.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].portfolio_name).toBe("แฟ้มใหม่");
  });

  it("puts the chosen skills on the new portfolio", async () => {
    const student = await createStudent();
    const chosen = await createPortfolioSkill({ user_id: student.student_id });
    const alsoChosen = await createPortfolioSkill({
      user_id: student.student_id,
    });
    const notChosen = await createPortfolioSkill({
      user_id: student.student_id,
    });

    const response = await request(app)
      .post("/portfolio")
      .send({
        user_id: student.student_id,
        selectedSkillIds: [chosen.id, alsoChosen.id],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.selectedSkillIds.sort()).toEqual(
      [chosen.id, alsoChosen.id].sort(),
    );
    expect(
      await prisma.portfolio_skill_mapping.count({
        where: { skill_id: notChosen.id },
      }),
    ).toBe(0);
  });

  it("refuses a request that names no user", async () => {
    const response = await request(app)
      .post("/portfolio")
      .send({ portfolio_name: "แฟ้มไร้เจ้าของ" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "body", message: "ต้องระบุ" }],
    });
    expect(
      await prisma.portfolio.count({
        where: { portfolio_name: "แฟ้มไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("refuses a template and a skill list it cannot read", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio")
      .send({
        user_id: student.student_id,
        template_id: "คลาสสิก",
        selectedSkillIds: ["ทักษะแรก"],
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "template_id", location: "body", message: "ต้องเป็นตัวเลข" },
      {
        field: "selectedSkillIds[0]",
        location: "body",
        message: "ต้องเป็นตัวเลข",
      },
    ]);
    expect(
      await prisma.portfolio.count({ where: { user_id: student.student_id } }),
    ).toBe(0);
  });

  it("fails for a user who does not exist", async () => {
    const response = await request(app)
      .post("/portfolio")
      .send({ user_id: "99999999", portfolio_name: "แฟ้มผี" });

    expect(response.status).toBe(500);
    expect(
      await prisma.portfolio.count({ where: { user_id: "99999999" } }),
    ).toBe(0);
  });
});

describe("PUT /portfolio/:id", () => {
  it("overwrites the fields the request carries", async () => {
    const portfolio = await createPortfolio({
      portfolio_name: "ชื่อเดิม",
      template_color: "#000000",
    });

    const response = await request(app)
      .put(`/portfolio/${portfolio.id}`)
      .send({ portfolio_name: "ชื่อใหม่", isShowThesis: false });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: portfolio.id,
      portfolioName: "ชื่อใหม่",
      templateColor: "#000000",
      isShowThesis: false,
    });
    expect(
      (
        await prisma.portfolio.findUniqueOrThrow({
          where: { id: portfolio.id },
        })
      ).portfolio_name,
    ).toBe("ชื่อใหม่");
  });

  it("replaces the chosen skills rather than adding to them", async () => {
    const student = await createStudent();
    const dropped = await createPortfolioSkill({ user_id: student.student_id });
    const added = await createPortfolioSkill({ user_id: student.student_id });
    const portfolio = await createPortfolio({
      user_id: student.student_id,
      skill_ids: [dropped.id],
    });

    const response = await request(app)
      .put(`/portfolio/${portfolio.id}`)
      .send({ selectedSkillIds: [added.id] });

    expect(response.status).toBe(200);
    expect(response.body.data.selectedSkillIds).toEqual([added.id]);
    expect(
      await prisma.portfolio_skill_mapping.findMany({
        where: { portfolio_id: portfolio.id },
      }),
    ).toEqual([{ portfolio_id: portfolio.id, skill_id: added.id }]);
  });

  it("leaves the chosen skills alone when the request says nothing about them", async () => {
    const student = await createStudent();
    const skill = await createPortfolioSkill({ user_id: student.student_id });
    const portfolio = await createPortfolio({
      user_id: student.student_id,
      skill_ids: [skill.id],
    });

    const response = await request(app)
      .put(`/portfolio/${portfolio.id}`)
      .send({ portfolio_name: "ชื่อใหม่" });

    expect(response.body.data.selectedSkillIds).toEqual([skill.id]);
  });

  it("fails for a portfolio that does not exist", async () => {
    const response = await request(app)
      .put(`/portfolio/${UNUSED_ID}`)
      .send({ portfolio_name: "ชื่อใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("PATCH /portfolio/:id", () => {
  it("updates the same way PUT does", async () => {
    // Both verbs are registered against the same handler, so a PATCH is a
    // whole-object update too — sending one field does not leave the others
    // alone because the handler is partial, but because the request was.
    const portfolio = await createPortfolio({
      portfolio_name: "ชื่อเดิม",
      about_me: "แนะนำตัวเดิม",
    });

    const response = await request(app)
      .patch(`/portfolio/${portfolio.id}`)
      .send({ portfolio_name: "ชื่อใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      portfolioName: "ชื่อใหม่",
      about_me: "แนะนำตัวเดิม",
    });
  });

  it("fails for a portfolio that does not exist", async () => {
    const response = await request(app)
      .patch(`/portfolio/${UNUSED_ID}`)
      .send({ portfolio_name: "ชื่อใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio/:id", () => {
  it("removes the portfolio and the skills chosen for it", async () => {
    const student = await createStudent();
    const skill = await createPortfolioSkill({ user_id: student.student_id });
    const doomed = await createPortfolio({
      user_id: student.student_id,
      skill_ids: [skill.id],
    });
    const kept = await createPortfolio({ user_id: student.student_id });

    const response = await request(app).delete(`/portfolio/${doomed.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio.findUnique({ where: { id: doomed.id } }),
    ).toBeNull();
    expect(
      await prisma.portfolio_skill_mapping.count({
        where: { portfolio_id: doomed.id },
      }),
    ).toBe(0);

    // The mapping went, the skill itself stayed — it belongs to the student,
    // not to the portfolio that displayed it.
    expect(
      await prisma.portfolio_skill.findUnique({ where: { id: skill.id } }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
  });

  it("fails for a portfolio that does not exist", async () => {
    const response = await request(app).delete(`/portfolio/${UNUSED_ID}`);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
