import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import {
  createPortfolioSkill,
  createPortfolioSkillActivityMapping,
  createStudent,
  createSubmission,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * Skills and the work that evidences them — /portfolio-skill.
 *
 * The widest surface in the group: nine handlers and no uploads. A skill is a
 * name the student chooses; a mapping ties that skill to a piece of submitted
 * coursework, and the same submission usually carries one mapping per skill it
 * demonstrates.
 *
 * Two shapes are worth knowing before reading the cases:
 *
 * - /works reads the mappings back the other way round, grouped by submission
 *   rather than by skill, and pulls the teacher's feedback in from
 *   student_activity. It is what the "my work" page renders.
 * - /assign-work replaces rather than adds: it deletes this user's mappings for
 *   the submission before writing the new set. That is what makes editing a
 *   work's skill list a single call.
 *
 * portfolio_skill_activity_mapping.student_activity_id has no foreign key, so a
 * mapping can name a submission that does not exist.
 *
 * Ownership is two-layered here since #31: a skill owns itself, and a mapping
 * is owned by the skill it hangs off. /assign-work is the one route in the
 * group whose check is not the middleware's — it names skills in the body, and
 * the service refuses the transaction unless every one of them is the caller's.
 * See docs/adr/0001-portfolio-access.md.
 */

describe("GET /portfolio-skill", () => {
  it("returns the student's skills with their mappings", async () => {
    const student = await createStudent();
    const first = await createPortfolioSkill({
      user_id: student.student_id,
      name: "การเขียนโปรแกรม",
    });
    const second = await createPortfolioSkill({
      user_id: student.student_id,
      name: "การทำงานเป็นทีม",
    });
    const submission = await createSubmission();
    await createPortfolioSkillActivityMapping({
      skill_id: first.id,
      student_activity_id: submission.id,
      repository: "https://example.test/repo",
    });

    const response = await request(app)
      .get("/portfolio-skill")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data.map((s: { id: number }) => s.id)).toEqual([
      first.id,
      second.id,
    ]);
    expect(response.body.data[0]).toMatchObject({
      id: first.id,
      user_id: student.student_id,
      name: "การเขียนโปรแกรม",
    });
    expect(response.body.data[0].mappings).toMatchObject([
      {
        skill_id: first.id,
        student_activity_id: submission.id,
        repository: "https://example.test/repo",
      },
    ]);
    expect(response.body.data[1].mappings).toEqual([]);
  });

  it("leaves out another student's skills", async () => {
    const student = await createStudent();
    const mine = await createPortfolioSkill({ user_id: student.student_id });
    await createPortfolioSkill();

    const response = await request(app)
      .get("/portfolio-skill")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.body.data.map((s: { id: number }) => s.id)).toEqual([
      mine.id,
    ]);
  });

  it("refuses a request that names no user", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-skill")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /portfolio-skill/works", () => {
  it("groups the mappings by submission and carries the feedback", async () => {
    // The word "works" is a path of its own, registered before /:id, so it is
    // never read as an id.
    const student = await createStudent();
    const submission = await createSubmission({
      student_id: student.student_id,
      feedback: "ทำได้ดีมาก",
    });
    const coding = await createPortfolioSkill({
      user_id: student.student_id,
      name: "การเขียนโปรแกรม",
    });
    const teamwork = await createPortfolioSkill({
      user_id: student.student_id,
      name: "การทำงานเป็นทีม",
    });
    const first = await createPortfolioSkillActivityMapping({
      skill_id: coding.id,
      student_activity_id: submission.id,
      repository: "https://example.test/repo",
      reflection: "ได้เรียนรู้การแบ่งงาน",
      isShowRepo: true,
    });
    const second = await createPortfolioSkillActivityMapping({
      skill_id: teamwork.id,
      student_activity_id: submission.id,
    });

    const response = await request(app)
      .get("/portfolio-skill/works")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual({
      student_activity_id: submission.id,
      mapping_ids: [first.id, second.id],
      skills: [
        { id: coding.id, name: "การเขียนโปรแกรม" },
        { id: teamwork.id, name: "การทำงานเป็นทีม" },
      ],
      // The detail fields come off whichever mapping is seen first — they are
      // written the same on every mapping the submission has.
      repository: "https://example.test/repo",
      role_and_resp: null,
      init_expect: null,
      reflection: "ได้เรียนรู้การแบ่งงาน",
      isShowRepo: true,
      isShowRole: false,
      isShowInit: false,
      isShowReflec: false,
      feedback: "ทำได้ดีมาก",
    });
  });

  it("leaves out work mapped to another student's skills", async () => {
    const student = await createStudent();
    const mine = await createSubmission({ student_id: student.student_id });
    const skill = await createPortfolioSkill({ user_id: student.student_id });
    await createPortfolioSkillActivityMapping({
      skill_id: skill.id,
      student_activity_id: mine.id,
    });
    await createPortfolioSkillActivityMapping();

    const response = await request(app)
      .get("/portfolio-skill/works")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ user_id: student.student_id });

    expect(
      response.body.data.map(
        (w: { student_activity_id: number }) => w.student_activity_id,
      ),
    ).toEqual([mine.id]);
  });

  it("refuses a student asking for somebody else's work", async () => {
    const owner = await createStudent();
    const stranger = await createStudent();

    const response = await request(app)
      .get("/portfolio-skill/works")
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
      .get("/portfolio-skill/works")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: user_id ต้องระบุ",
      errors: [{ field: "user_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /portfolio-skill/:id", () => {
  it("returns the skill the id names", async () => {
    const skill = await createPortfolioSkill({ name: "การเขียนโปรแกรม" });

    const response = await request(app)
      .get(`/portfolio-skill/${skill.id}`)
      .set("Cookie", sessionCookie({ userId: skill.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: skill.id,
      name: "การเขียนโปรแกรม",
      mappings: [],
    });
  });

  it("refuses another student's skill", async () => {
    const stranger = await createStudent();
    const skill = await createPortfolioSkill();

    const response = await request(app)
      .get(`/portfolio-skill/${skill.id}`)
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
      .get("/portfolio-skill/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no skill", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-skill/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบทักษะที่ต้องการ",
    });
  });
});

describe("POST /portfolio-skill", () => {
  it("creates a skill and hands it back", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-skill")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "การเขียนโปรแกรม" });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      user_id: student.student_id,
      name: "การเขียนโปรแกรม",
      mappings: [],
    });

    const stored = await prisma.portfolio_skill.findMany({
      where: { user_id: student.student_id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("การเขียนโปรแกรม");
  });

  it("writes the mappings the request carries along with the skill", async () => {
    const student = await createStudent();
    const submission = await createSubmission();

    const response = await request(app)
      .post("/portfolio-skill")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        name: "การเขียนโปรแกรม",
        mappings: [
          {
            student_activity_id: submission.id,
            repository: "https://example.test/repo",
            isShowRepo: true,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.mappings).toMatchObject([
      {
        student_activity_id: submission.id,
        repository: "https://example.test/repo",
        isShowRepo: true,
        // The flags the request said nothing about are written false, not left
        // to the column's default.
        isShowRole: false,
        isShowInit: false,
        isShowReflec: false,
      },
    ]);
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-skill")
      .send({ name: "ทักษะไร้เจ้าของ" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
    expect(
      await prisma.portfolio_skill.count({
        where: { name: "ทักษะไร้เจ้าของ" },
      }),
    ).toBe(0);
  });

  it("refuses a mapping that names no work", async () => {
    // See BEHAVIOR-CHANGES.md. student_activity_id has no foreign key, so a
    // mapping with none used to be written with the column left NULL — a row
    // evidencing a skill with nothing at all.
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-skill")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        name: "การเขียนโปรแกรม",
        mappings: [{ repository: "https://example.test/repo" }],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message:
        "ข้อมูลที่ส่งมาไม่ถูกต้อง: mappings[0].student_activity_id ต้องระบุ",
      errors: [
        {
          field: "mappings[0].student_activity_id",
          location: "body",
          message: "ต้องระบุ",
        },
      ],
    });
    expect(
      await prisma.portfolio_skill.count({
        where: { user_id: student.student_id },
      }),
    ).toBe(0);
  });

  it("refuses a session for a user who does not exist", async () => {
    const response = await request(app)
      .post("/portfolio-skill")
      .set("Cookie", sessionCookie({ userId: "99999999" }))
      .send({ name: "ทักษะไร้เจ้าของ" });

    expect(response.status).toBe(401);
    expect(
      await prisma.portfolio_skill.count({ where: { user_id: "99999999" } }),
    ).toBe(0);
  });
});

describe("PUT /portfolio-skill/:id", () => {
  it("renames the skill", async () => {
    const skill = await createPortfolioSkill({ name: "ชื่อเดิม" });

    const response = await request(app)
      .put(`/portfolio-skill/${skill.id}`)
      .set("Cookie", sessionCookie({ userId: skill.user_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: skill.id,
      name: "ชื่อใหม่",
    });
    expect(
      (
        await prisma.portfolio_skill.findUniqueOrThrow({
          where: { id: skill.id },
        })
      ).name,
    ).toBe("ชื่อใหม่");
  });

  it("replaces the mappings rather than adding to them", async () => {
    const skill = await createPortfolioSkill();
    const old = await createSubmission();
    const fresh = await createSubmission();
    await createPortfolioSkillActivityMapping({
      skill_id: skill.id,
      student_activity_id: old.id,
    });

    const response = await request(app)
      .put(`/portfolio-skill/${skill.id}`)
      .set("Cookie", sessionCookie({ userId: skill.user_id }))
      .send({ mappings: [{ student_activity_id: fresh.id }] });

    expect(response.status).toBe(200);
    expect(
      response.body.data.mappings.map(
        (m: { student_activity_id: number }) => m.student_activity_id,
      ),
    ).toEqual([fresh.id]);
    expect(
      await prisma.portfolio_skill_activity_mapping.findMany({
        where: { skill_id: skill.id },
      }),
    ).toHaveLength(1);
  });

  it("clears the mappings when the request carries an empty list", async () => {
    const skill = await createPortfolioSkill();
    await createPortfolioSkillActivityMapping({ skill_id: skill.id });

    const response = await request(app)
      .put(`/portfolio-skill/${skill.id}`)
      .set("Cookie", sessionCookie({ userId: skill.user_id }))
      .send({ mappings: [] });

    expect(response.status).toBe(200);
    expect(response.body.data.mappings).toEqual([]);
    expect(
      await prisma.portfolio_skill_activity_mapping.findMany({
        where: { skill_id: skill.id },
      }),
    ).toHaveLength(0);
  });

  it("leaves the mappings alone when the request says nothing about them", async () => {
    const skill = await createPortfolioSkill({ name: "ชื่อเดิม" });
    const mapping = await createPortfolioSkillActivityMapping({
      skill_id: skill.id,
    });

    const response = await request(app)
      .put(`/portfolio-skill/${skill.id}`)
      .set("Cookie", sessionCookie({ userId: skill.user_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(200);
    expect(response.body.data.mappings.map((m: { id: number }) => m.id)).toEqual(
      [mapping.id],
    );
  });

  it("refuses another student's skill, and changes nothing", async () => {
    const stranger = await createStudent();
    const skill = await createPortfolioSkill({ name: "ชื่อเดิม" });

    const response = await request(app)
      .put(`/portfolio-skill/${skill.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(403);
    expect(
      (
        await prisma.portfolio_skill.findUniqueOrThrow({
          where: { id: skill.id },
        })
      ).name,
    ).toBe("ชื่อเดิม");
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-skill/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a skill that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .put("/portfolio-skill/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ name: "ชื่อใหม่" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("DELETE /portfolio-skill/:id", () => {
  it("removes the skill and the mappings hanging off it", async () => {
    const student = await createStudent();
    const doomed = await createPortfolioSkill({ user_id: student.student_id });
    const kept = await createPortfolioSkill({ user_id: student.student_id });
    const mapping = await createPortfolioSkillActivityMapping({
      skill_id: doomed.id,
    });

    const response = await request(app)
      .delete(`/portfolio-skill/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_skill.findMany({
        where: { user_id: student.student_id },
      }),
    ).toHaveLength(1);
    expect(
      await prisma.portfolio_skill.findUnique({ where: { id: kept.id } }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_skill_activity_mapping.findUnique({
        where: { id: mapping.id },
      }),
    ).toBeNull();
  });

  it("refuses another student's skill, and deletes nothing", async () => {
    const stranger = await createStudent();
    const skill = await createPortfolioSkill();

    const response = await request(app)
      .delete(`/portfolio-skill/${skill.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_skill.findUnique({ where: { id: skill.id } }),
    ).not.toBeNull();
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-skill/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a skill that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-skill/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});

describe("GET /portfolio-skill/mapping/:id", () => {
  it("returns the mapping the id names, with the skill it belongs to", async () => {
    const skill = await createPortfolioSkill({ name: "การเขียนโปรแกรม" });
    const mapping = await createPortfolioSkillActivityMapping({
      skill_id: skill.id,
      reflection: "ได้เรียนรู้การแบ่งงาน",
    });

    const response = await request(app)
      .get(`/portfolio-skill/mapping/${mapping.id}`)
      .set("Cookie", sessionCookie({ userId: skill.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: mapping.id,
      skill_id: skill.id,
      reflection: "ได้เรียนรู้การแบ่งงาน",
      portfolio_skill: { id: skill.id, name: "การเขียนโปรแกรม" },
    });
  });

  it("refuses a mapping hanging off another student's skill", async () => {
    // The mapping has no user_id of its own; the owner is read through the
    // skill it belongs to.
    const stranger = await createStudent();
    const mapping = await createPortfolioSkillActivityMapping();

    const response = await request(app)
      .get(`/portfolio-skill/mapping/${mapping.id}`)
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
      .get("/portfolio-skill/mapping/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("answers 404 for an id that belongs to no mapping", async () => {
    const student = await createStudent();

    const response = await request(app)
      .get("/portfolio-skill/mapping/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบการเชื่อมโยงชิ้นงานกับทักษะที่ต้องการ",
    });
  });
});

describe("POST /portfolio-skill/assign-work", () => {
  it("maps the submission onto every skill the request names", async () => {
    const student = await createStudent();
    const submission = await createSubmission({
      student_id: student.student_id,
    });
    const coding = await createPortfolioSkill({
      user_id: student.student_id,
    });
    const teamwork = await createPortfolioSkill({
      user_id: student.student_id,
    });

    const response = await request(app)
      .post("/portfolio-skill/assign-work")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        student_activity_id: submission.id,
        skill_ids: [coding.id, teamwork.id],
        repository: "https://example.test/repo",
        isShowRepo: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toBeNull();

    const stored = await prisma.portfolio_skill_activity_mapping.findMany({
      where: { student_activity_id: submission.id },
      orderBy: { skill_id: "asc" },
    });
    expect(stored.map((m) => m.skill_id)).toEqual([coding.id, teamwork.id]);
    expect(stored[0]).toMatchObject({
      repository: "https://example.test/repo",
      isShowRepo: true,
      isShowRole: false,
      isShowInit: false,
      isShowReflec: false,
    });
  });

  it("replaces the mappings this student already had for the submission", async () => {
    const student = await createStudent();
    const submission = await createSubmission({
      student_id: student.student_id,
    });
    const dropped = await createPortfolioSkill({
      user_id: student.student_id,
    });
    const added = await createPortfolioSkill({ user_id: student.student_id });
    await createPortfolioSkillActivityMapping({
      skill_id: dropped.id,
      student_activity_id: submission.id,
    });

    const response = await request(app)
      .post("/portfolio-skill/assign-work")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        student_activity_id: submission.id,
        skill_ids: [added.id],
      });

    expect(response.status).toBe(201);
    expect(
      (
        await prisma.portfolio_skill_activity_mapping.findMany({
          where: { student_activity_id: submission.id },
        })
      ).map((m) => m.skill_id),
    ).toEqual([added.id]);
  });

  it("accepts a submission id that names nothing", async () => {
    // Recorded, not endorsed: student_activity_id carries no foreign key, so
    // the mapping is written and /works simply finds no feedback for it.
    const student = await createStudent();
    const skill = await createPortfolioSkill({ user_id: student.student_id });

    const response = await request(app)
      .post("/portfolio-skill/assign-work")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        student_activity_id: 999999,
        skill_ids: [skill.id],
      });

    expect(response.status).toBe(201);
    expect(
      await prisma.portfolio_skill_activity_mapping.count({
        where: { student_activity_id: 999999 },
      }),
    ).toBe(1);
  });

  it("refuses to map a skill that belongs to somebody else", async () => {
    // See BEHAVIOR-CHANGES.md. The refusal used to be measured against the
    // user_id in the body, which the caller also wrote — so naming the skill's
    // owner satisfied it. It is the session's user now.
    const student = await createStudent();
    const stranger = await createStudent();
    const mine = await createPortfolioSkill({ user_id: student.student_id });
    const theirs = await createPortfolioSkill({
      user_id: stranger.student_id,
    });
    const submission = await createSubmission({
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/portfolio-skill/assign-work")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        student_activity_id: submission.id,
        skill_ids: [mine.id, theirs.id],
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      message: "มีทักษะบางรายการที่ไม่ใช่ของผู้ใช้รายนี้",
    });
    // The whole call is one transaction, so the skill that was the caller's own
    // gets no mapping either.
    expect(
      await prisma.portfolio_skill_activity_mapping.count({
        where: { student_activity_id: submission.id },
      }),
    ).toBe(0);
  });

  it("refuses a request with no session", async () => {
    const response = await request(app)
      .post("/portfolio-skill/assign-work")
      .send({ student_activity_id: 1, skill_ids: [1] });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a request that names no submission", async () => {
    const student = await createStudent();

    const response = await request(app)
      .post("/portfolio-skill/assign-work")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({ skill_ids: [1] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: student_activity_id ต้องระบุ",
      errors: [
        {
          field: "student_activity_id",
          location: "body",
          message: "ต้องระบุ",
        },
      ],
    });
  });

  it("refuses a request whose skill list is empty", async () => {
    const student = await createStudent();
    const submission = await createSubmission({
      student_id: student.student_id,
    });

    const response = await request(app)
      .post("/portfolio-skill/assign-work")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .send({
        student_activity_id: submission.id,
        skill_ids: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: skill_ids ต้องมีอย่างน้อย 1 รายการ",
      errors: [
        {
          field: "skill_ids",
          location: "body",
          message: "ต้องมีอย่างน้อย 1 รายการ",
        },
      ],
    });
    expect(
      await prisma.portfolio_skill_activity_mapping.count({
        where: { student_activity_id: submission.id },
      }),
    ).toBe(0);
  });
});

describe("DELETE /portfolio-skill/mapping/:id", () => {
  it("removes the mapping and leaves the skill standing", async () => {
    const skill = await createPortfolioSkill();
    const doomed = await createPortfolioSkillActivityMapping({
      skill_id: skill.id,
    });
    const kept = await createPortfolioSkillActivityMapping({
      skill_id: skill.id,
    });

    const response = await request(app)
      .delete(`/portfolio-skill/mapping/${doomed.id}`)
      .set("Cookie", sessionCookie({ userId: skill.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(
      await prisma.portfolio_skill_activity_mapping.findUnique({
        where: { id: doomed.id },
      }),
    ).toBeNull();
    expect(
      await prisma.portfolio_skill_activity_mapping.findUnique({
        where: { id: kept.id },
      }),
    ).not.toBeNull();
    expect(
      await prisma.portfolio_skill.findUnique({ where: { id: skill.id } }),
    ).not.toBeNull();
  });

  it("refuses a mapping hanging off another student's skill", async () => {
    const stranger = await createStudent();
    const mapping = await createPortfolioSkillActivityMapping();

    const response = await request(app)
      .delete(`/portfolio-skill/mapping/${mapping.id}`)
      .set("Cookie", sessionCookie({ userId: stranger.student_id }));

    expect(response.status).toBe(403);
    expect(
      await prisma.portfolio_skill_activity_mapping.findUnique({
        where: { id: mapping.id },
      }),
    ).not.toBeNull();
  });

  it("answers 400 for an id that is not a number", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-skill/mapping/abc")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: id ต้องเป็นตัวเลข",
      errors: [{ field: "id", location: "params", message: "ต้องเป็นตัวเลข" }],
    });
  });

  it("fails for a mapping that does not exist", async () => {
    const student = await createStudent();

    const response = await request(app)
      .delete("/portfolio-skill/mapping/999999")
      .set("Cookie", sessionCookie({ userId: student.student_id }));

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
