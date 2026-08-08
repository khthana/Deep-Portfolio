import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { BASELINE } from "./seed";
import {
  createCLO,
  createCourse,
  createPLO,
  createTeacher,
  createUser,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * The course learning outcomes of a section, and the programme learning
 * outcomes they map onto — /course/clo and /course/plo/list.
 *
 * Reading is open to anyone; writing is a teacher's. Note what "a teacher's"
 * means here and everywhere else in this API: any teacher, not the teacher of
 * this section. Nothing checks that the caller has anything to do with the
 * section named in the request, and the cases below record that rather than
 * pretend otherwise — see docs/spec-refactor-redeploy.md.
 */

describe("GET /course/clo", () => {
  it("returns the section's outcomes with the PLO each maps onto", async () => {
    const course = await createCourse();
    const plo = await createPLO({
      outcome_code: "PLO-APPLY",
      outcome_title: "ประยุกต์ใช้ความรู้",
      outcome_description: "ประยุกต์ใช้ความรู้ในการแก้ปัญหาทางวิศวกรรม",
    });
    await createCLO({
      section_id: course.section_id,
      clo_number: "1",
      clo_detail: "อธิบายหลักการของระบบฐานข้อมูลได้",
      plo_id: plo.outcome_id,
    });

    // No cookie: a student's course page reads this.
    const response = await request(app)
      .get("/course/clo")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({
        clo_number: "1",
        clo_detail: "อธิบายหลักการของระบบฐานข้อมูลได้",
        plo_id: plo.outcome_id,
        section_id: course.section_id,
        outcome_code: "PLO-APPLY",
        outcome_title: "ประยุกต์ใช้ความรู้",
        outcome_description: "ประยุกต์ใช้ความรู้ในการแก้ปัญหาทางวิศวกรรม",
      }),
    ]);
  });

  it("returns only this section's outcomes, oldest first", async () => {
    const course = await createCourse();
    const otherCourse = await createCourse();
    const second = await createCLO({
      section_id: course.section_id,
      clo_number: "2",
    });
    const first = await createCLO({
      section_id: course.section_id,
      clo_number: "1",
    });
    await createCLO({ section_id: otherCourse.section_id });

    const response = await request(app)
      .get("/course/clo")
      .query({ section_id: course.section_id });

    // By clo_id, which is insertion order — not by clo_number, which is why
    // the "2" above comes back first.
    expect(response.body.data.map((clo: { clo_id: number }) => clo.clo_id))
      .toEqual([second.clo_id, first.clo_id]);
  });

  it("returns an empty list for a section that has none", async () => {
    const course = await createCourse();

    const response = await request(app)
      .get("/course/clo")
      .query({ section_id: course.section_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("fails when section_id is missing", async () => {
    // parseInt(undefined) is NaN and the query goes to Prisma as it is, so a
    // caller that forgets the parameter gets a 500 rather than a 400. Recorded,
    // not endorsed: request validation is issue #20.
    const response = await request(app).get("/course/clo");

    expect(response.status).toBe(500);
  });
});

describe("POST /course/clo", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).post("/course/clo").send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();

    const response = await request(app)
      .post("/course/clo")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({
        clo_number: "1",
        clo_detail: "อธิบายหลักการของระบบฐานข้อมูลได้",
        section_id: course.section_id,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });

    const stored = await prisma.subject_clo.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toEqual([]);
  });

  it("adds an outcome to the section and returns its id", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const plo = await createPLO();

    const response = await request(app)
      .post("/course/clo")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        clo_number: "1",
        clo_detail: "อธิบายหลักการของระบบฐานข้อมูลได้",
        plo_id: plo.outcome_id,
        section_id: course.section_id,
        created_by: teacher.user_id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.any(Number));

    const stored = await prisma.subject_clo.findUnique({
      where: { clo_id: response.body.data },
    });
    expect(stored).toMatchObject({
      clo_number: "1",
      clo_detail: "อธิบายหลักการของระบบฐานข้อมูลได้",
      plo_id: plo.outcome_id,
      section_id: course.section_id,
    });
  });

  it("does not store created_by, even though the frontend sends it", async () => {
    // The column exists and the request carries a value for it; the service
    // has the assignment commented out. Recorded because a reader of the
    // frontend would reasonably expect the opposite.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });

    const response = await request(app)
      .post("/course/clo")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        clo_number: "1",
        clo_detail: "อธิบายหลักการของระบบฐานข้อมูลได้",
        section_id: course.section_id,
        created_by: teacher.user_id,
      });

    const stored = await prisma.subject_clo.findUnique({
      where: { clo_id: response.body.data },
    });
    expect(stored?.created_by).toBeNull();
  });

  it("fails when the section already has that outcome number", async () => {
    // uq_subject_clo — (section_id, clo_number) is unique.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    await createCLO({ section_id: course.section_id, clo_number: "1" });

    const response = await request(app)
      .post("/course/clo")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        clo_number: "1",
        clo_detail: "รายการซ้ำ",
        section_id: course.section_id,
      });

    expect(response.status).toBe(500);

    const stored = await prisma.subject_clo.findMany({
      where: { section_id: course.section_id },
    });
    expect(stored).toHaveLength(1);
  });
});

describe("PUT /course/clo", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).put("/course/clo").send({});

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const clo = await createCLO({
      section_id: course.section_id,
      clo_detail: "ข้อความเดิม",
    });

    const response = await request(app)
      .put("/course/clo")
      .set("Cookie", sessionCookie({ userId: user.user_id }))
      .send({ id: clo.clo_id, clo_detail: "ข้อความใหม่" });

    expect(response.status).toBe(403);

    const stored = await prisma.subject_clo.findUnique({
      where: { clo_id: clo.clo_id },
    });
    expect(stored?.clo_detail).toBe("ข้อความเดิม");
  });

  it("changes the detail and the PLO it maps onto", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const clo = await createCLO({
      section_id: course.section_id,
      clo_detail: "ข้อความเดิม",
    });
    const newPLO = await createPLO();

    const response = await request(app)
      .put("/course/clo")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({
        id: clo.clo_id,
        clo_detail: "อธิบายหลักการของระบบฐานข้อมูลเชิงสัมพันธ์ได้",
        plo_id: newPLO.outcome_id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      clo_id: clo.clo_id,
      clo_detail: "อธิบายหลักการของระบบฐานข้อมูลเชิงสัมพันธ์ได้",
      plo_id: newPLO.outcome_id,
    });

    const stored = await prisma.subject_clo.findUnique({
      where: { clo_id: clo.clo_id },
    });
    expect(stored).toMatchObject({
      clo_detail: "อธิบายหลักการของระบบฐานข้อมูลเชิงสัมพันธ์ได้",
      plo_id: newPLO.outcome_id,
    });
  });

  it("leaves the outcome number alone", async () => {
    // clo_number is not in UpdateCLOBody, so the renumbering that DELETE does
    // is the only thing that ever changes it.
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const clo = await createCLO({
      section_id: course.section_id,
      clo_number: "3",
    });

    await request(app)
      .put("/course/clo")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ id: clo.clo_id, clo_number: "9", clo_detail: "ข้อความใหม่" });

    const stored = await prisma.subject_clo.findUnique({
      where: { clo_id: clo.clo_id },
    });
    expect(stored?.clo_number).toBe("3");
  });

  it("fails for an outcome that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .put("/course/clo")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .send({ id: 999_999, clo_detail: "ข้อความใหม่" });

    expect(response.status).toBe(500);
  });
});

describe("DELETE /course/clo", () => {
  it("rejects a request with no session", async () => {
    const response = await request(app).delete("/course/clo");

    expect(response.status).toBe(401);
  });

  it("rejects a signed-in user who is not a teacher", async () => {
    const user = await createUser();
    const course = await createCourse();
    const clo = await createCLO({ section_id: course.section_id });

    const response = await request(app)
      .delete("/course/clo")
      .query({ clo_id: clo.clo_id })
      .set("Cookie", sessionCookie({ userId: user.user_id }));

    expect(response.status).toBe(403);

    const stored = await prisma.subject_clo.findUnique({
      where: { clo_id: clo.clo_id },
    });
    expect(stored).not.toBeNull();
  });

  it("removes the outcome and renumbers what is left", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const first = await createCLO({
      section_id: course.section_id,
      clo_number: "1",
    });
    const second = await createCLO({
      section_id: course.section_id,
      clo_number: "2",
    });
    const third = await createCLO({
      section_id: course.section_id,
      clo_number: "3",
    });

    const response = await request(app)
      .delete("/course/clo")
      .query({ clo_id: first.clo_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ clo_id: first.clo_id });

    const remaining = await prisma.subject_clo.findMany({
      where: { section_id: course.section_id },
      orderBy: { clo_id: "asc" },
    });
    expect(
      remaining.map((clo) => [clo.clo_id, clo.clo_number]),
    ).toEqual([
      [second.clo_id, "1"],
      [third.clo_id, "2"],
    ]);
  });

  it("renumbers only the section the outcome belonged to", async () => {
    const teacher = await createTeacher();
    const course = await createCourse({ teacher_id: teacher.user_id });
    const otherCourse = await createCourse({ teacher_id: teacher.user_id });
    const doomed = await createCLO({
      section_id: course.section_id,
      clo_number: "1",
    });
    const untouched = await createCLO({
      section_id: otherCourse.section_id,
      clo_number: "7",
    });

    await request(app)
      .delete("/course/clo")
      .query({ clo_id: doomed.clo_id })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    const stored = await prisma.subject_clo.findUnique({
      where: { clo_id: untouched.clo_id },
    });
    expect(stored?.clo_number).toBe("7");
  });

  it("fails for an outcome that does not exist", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .delete("/course/clo")
      .query({ clo_id: 999_999 })
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(500);
  });
});

describe("GET /course/plo/list", () => {
  /** The ids the case created, in the order the endpoint returned them. The
   *  cases above have already put PLOs in the baseline programme — isolation
   *  here is per file, not per case — so a case about ordering has to look at
   *  its own rows rather than the whole list. */
  function positionsOf(
    response: request.Response,
    ids: number[],
  ): number[] {
    return response.body.data
      .map((plo: { outcome_id: number }) => plo.outcome_id)
      .filter((id: number) => ids.includes(id));
  }

  it("returns the programme's outcomes, oldest first", async () => {
    const second = await createPLO({ sequence_order: 2 });
    const first = await createPLO({ sequence_order: 1 });

    // No cookie: the CLO form loads this to fill its dropdown, and the student
    // side reads it too.
    const response = await request(app)
      .get("/course/plo/list")
      .query({ program_id: BASELINE.program.program_id });

    expect(response.status).toBe(200);
    // By outcome_id, not by sequence_order — so the one carrying sequence
    // order 2 comes back first, because it was inserted first.
    expect(
      positionsOf(response, [first.outcome_id, second.outcome_id]),
    ).toEqual([second.outcome_id, first.outcome_id]);
  });

  it("returns only the programme asked for", async () => {
    const mine = await createPLO({ program_id: BASELINE.program.program_id });
    const theirs = await createPLO({
      program_id: BASELINE.otherProgram.program_id,
    });

    const response = await request(app)
      .get("/course/plo/list")
      .query({ program_id: BASELINE.program.program_id });

    expect(
      positionsOf(response, [mine.outcome_id, theirs.outcome_id]),
    ).toEqual([mine.outcome_id]);
  });

  it("returns an empty list for a programme that does not exist", async () => {
    const response = await request(app)
      .get("/course/plo/list")
      .query({ program_id: "0000" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});
