import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { BASELINE } from "./seed";
import {
  createSharedRubric,
  createSharedRubricDetail,
  createStudent,
  createTeacher,
} from "./factories";
import { sessionCookie } from "./helpers/session";

/**
 * The programme's shared rubrics — /rubric.
 *
 * Reference data, and read-only: there is no endpoint in this system that
 * writes a `rubrics` row, so whoever owns the curriculum puts them in the
 * database by other means. A teacher writing an activity reads them here and
 * copies what they want into that activity's own rubric, which is a different
 * pair of tables entirely — see the note in test/factories/rubric.ts.
 *
 * Both endpoints are the teacher's, since #49: this was the last router in the
 * application with no middleware on it at all, and until then the catalogue of
 * every programme's assessment criteria answered anyone who asked, logged in or
 * not. The rule is the plain one — a teacher, any teacher — because "shared" is
 * what these rubrics are, and because the column that would narrow it to a
 * programme (`users.program_id`) is one the importer does not insist on. See
 * docs/adr/0014-shared-rubric-access.md.
 *
 * Neither endpoint looks its own subject up, so an id belonging to nothing is
 * answered with an empty list rather than a 404. That is deliberate and is the
 * scope note in the same ADR — two cases below stand on it.
 */

/** The ids in a response body, in the order the endpoint returned them. */
function ids(response: { body: { data: { id: number }[] } }): number[] {
  return response.body.data.map((row) => row.id);
}

describe("GET /rubric/shared-rubric", () => {
  it("returns the programme's rubrics in display order", async () => {
    const teacher = await createTeacher();
    const second = await createSharedRubric({
      rubric_name_th: "เกณฑ์การนำเสนอ",
      display_order: 2,
    });
    const first = await createSharedRubric({
      rubric_name_th: "เกณฑ์การเขียนรายงาน",
      display_order: 1,
    });

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ program_id: BASELINE.program.program_id });

    expect(response.status).toBe(200);
    expect(
      response.body.data.filter((rubric: { id: number }) =>
        [first.id, second.id].includes(rubric.id),
      ),
    ).toEqual([
      expect.objectContaining({
        id: first.id,
        rubric_name_th: "เกณฑ์การเขียนรายงาน",
        display_order: 1,
      }),
      expect.objectContaining({
        id: second.id,
        rubric_name_th: "เกณฑ์การนำเสนอ",
        display_order: 2,
      }),
    ]);
  });

  it("sends the eight columns of the row, and no others", async () => {
    // toEqual on the key set, not toMatchObject: since #68 the query names its
    // eight columns instead of taking whatever `rubrics` happens to hold, and
    // this is what says the two lists stay the same length. Nothing was over-
    // answered before — the table has exactly these eight — but the query had
    // no `select`, so the next column added to it would have gone out too
    // (ADR-0044 §1, ADR-0046 §1).
    const teacher = await createTeacher();
    await createSharedRubric();

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ program_id: BASELINE.program.program_id });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data[0]).sort()).toEqual([
      "created_by",
      "display_order",
      "id",
      "program_id",
      "rubric_code",
      "rubric_name_en",
      "rubric_name_th",
      "updated_by",
    ]);
  });

  it("returns only this programme's rubrics", async () => {
    const teacher = await createTeacher();
    const mine = await createSharedRubric();
    const theirs = await createSharedRubric({
      program_id: BASELINE.otherProgram.program_id,
    });

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ program_id: BASELINE.program.program_id });

    expect(ids(response)).toContain(mine.id);
    expect(ids(response)).not.toContain(theirs.id);
  });

  it("answers any teacher, not only one of that programme", async () => {
    // The teacher belongs to the baseline programme — that is what the factory
    // writes into `users.program_id` — and asks for the other one's rubrics.
    // Answering is the decision in ADR-0014, and this case is the one that
    // would fail if a later change narrowed the rule to the caller's own
    // programme without saying so.
    const teacher = await createTeacher();
    const rubric = await createSharedRubric({
      program_id: BASELINE.otherProgram.program_id,
    });

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ program_id: BASELINE.otherProgram.program_id });

    expect(response.status).toBe(200);
    expect(ids(response)).toContain(rubric.id);
  });

  it("returns an empty list for a programme that has nothing", async () => {
    // Nothing looks the programme up, so an id belonging to no programme at
    // all is answered the same way as one that simply has no rubrics yet.
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ program_id: "0000" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("refuses a caller with no session", async () => {
    await createSharedRubric();

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .query({ program_id: BASELINE.program.program_id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a student", async () => {
    const student = await createStudent();
    await createSharedRubric();

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ program_id: BASELINE.program.program_id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });

  it("answers 400 when no programme is named", async () => {
    // A missing parameter is `undefined`, and Prisma reads
    // `where: { program_id: undefined }` as "do not filter on this column"
    // rather than "match null" — so leaving the parameter out used to widen the
    // query to every programme instead of narrowing it to one.
    const teacher = await createTeacher();
    await createSharedRubric();
    await createSharedRubric({
      program_id: BASELINE.otherProgram.program_id,
    });

    const response = await request(app)
      .get("/rubric/shared-rubric")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง: program_id ต้องระบุ",
      errors: [{ field: "program_id", location: "query", message: "ต้องระบุ" }],
    });
  });
});

describe("GET /rubric/shared-rubric/detail", () => {
  it("returns the rubric's criteria in display order", async () => {
    const teacher = await createTeacher();
    const rubric = await createSharedRubric();
    const second = await createSharedRubricDetail({
      rubric_id: rubric.id,
      criteria_name_th: "ความสมบูรณ์",
      display_order: 2,
    });
    const first = await createSharedRubricDetail({
      rubric_id: rubric.id,
      criteria_name_th: "ความถูกต้อง",
      level_4_description: "ถูกต้องครบถ้วนทุกข้อ",
      display_order: 1,
    });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ rubric_id: rubric.id });

    expect(response.status).toBe(200);
    // Scoped to this rubric by the query, so the whole body is the assertion.
    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: first.id,
        criteria_name_th: "ความถูกต้อง",
        level_4_description: "ถูกต้องครบถ้วนทุกข้อ",
        display_order: 1,
      }),
      expect.objectContaining({
        id: second.id,
        criteria_name_th: "ความสมบูรณ์",
        display_order: 2,
      }),
    ]);
  });

  it("sends the twelve columns of a criterion, and no others", async () => {
    // The twin of the case one describe up, and the same reason. One row is one
    // criterion with its four level descriptions beside it as columns — which
    // is what `SharedRubricCriterion` is named for, rather than "the detail" of
    // a rubric (ADR-0046 §2).
    const teacher = await createTeacher();
    const rubric = await createSharedRubric();
    await createSharedRubricDetail({ rubric_id: rubric.id });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ rubric_id: rubric.id });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data[0]).sort()).toEqual([
      "created_by",
      "criteria_name_en",
      "criteria_name_th",
      "display_order",
      "id",
      "level_1_description",
      "level_2_description",
      "level_3_description",
      "level_4_description",
      "rubric_id",
      "updated_by",
      "weight",
    ]);
  });

  it("sends the criterion's weight as a number", async () => {
    // rubric_details.weight is Decimal(5,2) and used to reach the wire as the
    // string "2.5" (#33), the same shape as the gpa #16 converted.
    const teacher = await createTeacher();
    const rubric = await createSharedRubric();
    await createSharedRubricDetail({ rubric_id: rubric.id, weight: 2.5 });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ rubric_id: rubric.id });

    expect(response.status).toBe(200);
    expect(response.body.data[0].weight).toBe(2.5);
  });

  it("returns only this rubric's criteria", async () => {
    const teacher = await createTeacher();
    const rubric = await createSharedRubric();
    const other = await createSharedRubric();
    const mine = await createSharedRubricDetail({ rubric_id: rubric.id });
    await createSharedRubricDetail({ rubric_id: other.id });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ rubric_id: rubric.id });

    expect(ids(response)).toEqual([mine.id]);
  });

  it("returns an empty list for a rubric that does not exist", async () => {
    // The endpoint reads the detail table and never looks the rubric up, so a
    // wrong id is indistinguishable from a rubric with no criteria in it.
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ rubric_id: 999_999 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("refuses a caller with no session", async () => {
    const rubric = await createSharedRubric();
    await createSharedRubricDetail({ rubric_id: rubric.id });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .query({ rubric_id: rubric.id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "ไม่พบ Token หรือ Token หมดอายุ",
    });
  });

  it("refuses a student", async () => {
    const student = await createStudent();
    const rubric = await createSharedRubric();
    await createSharedRubricDetail({ rubric_id: rubric.id });

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .set("Cookie", sessionCookie({ userId: student.student_id }))
      .query({ rubric_id: rubric.id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "สิทธิ์การเข้าถึงเฉพาะอาจารย์เท่านั้น",
    });
  });

  it("answers 400 for a rubric id that is not a number", async () => {
    const teacher = await createTeacher();

    const response = await request(app)
      .get("/rubric/shared-rubric/detail")
      .set("Cookie", sessionCookie({ userId: teacher.user_id }))
      .query({ rubric_id: "เกณฑ์แรก" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "rubric_id", location: "query", message: "ต้องเป็นตัวเลข" },
    ]);
  });
});
